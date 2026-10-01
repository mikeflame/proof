import { spawnSync } from 'node:child_process';
import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import type { Span } from './parse.ts';

/**
 * VERIFIED: the repository backs the claim; `evidence` says where.
 * STALE: the repository contradicts it (missing path, missing script, other version).
 * UNCONFIRMED: no evidence either way (an identifier nobody uses, a package nobody depends on).
 * SKIPPED: not checkable here (outside the repository, an external tool).
 */
export type Status = 'VERIFIED' | 'STALE' | 'UNCONFIRMED' | 'SKIPPED';

export interface SpanResult extends Span {
  status: Status;
  evidence: string;
}

interface Pkg {
  dir: string;
  file: string;
  scripts: Record<string, string>;
  deps: Record<string, string>;
  engines: Record<string, string>;
}

export interface CheckContext {
  root: string;
  docFile: string;
  isGit: boolean;
  packages: Pkg[];
  /** Directories that hold a package.json, used to resolve paths written relative to a sub-project. */
  projectDirs: string[];
  /** Every tracked or untracked, non-ignored file, loaded on first use. */
  files?: string[];
}

/** Build output and dependencies are never evidence. */
const IGNORED_DIR = /(^|\/)(node_modules|\.git|dist|\.next|\.proof)(\/|$)/;
const skipIgnored = (p: unknown): boolean => IGNORED_DIR.test(typeof p === 'string' ? p : String((p as { name?: string })?.name ?? ''));

export function createContext(root: string, docFile: string): CheckContext {
  const files = globSync(['package.json', '*/package.json', '*/*/package.json'], { cwd: root, exclude: skipIgnored }).sort();
  const packages = files.map((file): Pkg => {
    const json = JSON.parse(readFileSync(join(root, file), 'utf8')) as Record<string, Record<string, string> | undefined>;
    return {
      dir: dirname(file),
      file,
      scripts: json.scripts ?? {},
      deps: { ...json.peerDependencies, ...json.devDependencies, ...json.dependencies },
      engines: json.engines ?? {},
    };
  });
  return {
    root,
    docFile,
    isGit: existsSync(join(root, '.git')),
    packages,
    projectDirs: packages.map((p) => p.dir).filter((d) => d !== '.'),
  };
}

const ok = (span: Span, evidence: string): SpanResult => ({ ...span, status: 'VERIFIED', evidence });
const stale = (span: Span, evidence: string): SpanResult => ({ ...span, status: 'STALE', evidence });
const unconfirmed = (span: Span, evidence: string): SpanResult => ({ ...span, status: 'UNCONFIRMED', evidence });
const skipped = (span: Span, evidence: string): SpanResult => ({ ...span, status: 'SKIPPED', evidence });

/** Expand `{a|b}` alternatives and turn `<name>` / `[name]` placeholders into `*`. */
export function expandPattern(p: string): string[] {
  const withStars = p.replace(/<[^>/]+>/g, '*').replace(/\[[A-Za-z][\w-]*\]/g, '*');
  const alt = withStars.match(/\{([^}]+)\}/);
  if (!alt) return [withStars];
  return (alt[1] ?? '').split(/[|,]/).flatMap((choice) => expandPattern(withStars.replace(alt[0], choice.trim())));
}

function findPath(ctx: CheckContext, pattern: string): string[] {
  const wantDir = pattern.endsWith('/');
  const clean = pattern.replace(/^\.\//, '').replace(/\/$/, '');
  if (/[*?]/.test(clean)) {
    return globSync(clean, { cwd: ctx.root, exclude: skipIgnored })
      .filter((m) => !wantDir || statSync(join(ctx.root, m)).isDirectory())
      .sort();
  }
  const abs = join(ctx.root, clean);
  if (!existsSync(abs)) return [];
  if (wantDir && !statSync(abs).isDirectory()) return [];
  return [clean];
}

/** The folder part of a pattern before its first wildcard, so `.proof/receipts/<tree>/x` gives `.proof/receipts`. */
function literalPrefix(pattern: string): string {
  const cut = pattern.search(/[*?]/);
  const head = cut < 0 ? pattern : pattern.slice(0, cut);
  return head.replace(/\/[^/]*$/, '').replace(/\/$/, '') || head.replace(/\/$/, '');
}

function isIgnored(ctx: CheckContext, path: string): boolean {
  if (!ctx.isGit || !path) return false;
  return spawnSync('git', ['check-ignore', '-q', path], { cwd: ctx.root }).status === 0;
}

/** All repository files git knows about (tracked or untracked, not ignored); dot-folders included, unlike `**` globs. */
function repoFiles(ctx: CheckContext): string[] {
  if (!ctx.files) {
    const res = ctx.isGit
      ? spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ctx.root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
      : null;
    ctx.files = res?.status === 0 ? res.stdout.split('\n').filter(Boolean) : globSync('**/*', { cwd: ctx.root, exclude: skipIgnored });
  }
  return ctx.files;
}

/** Files or folders anywhere in the repository whose path ends with `pattern` (`*` matches within one segment). */
function findAnywhere(ctx: CheckContext, pattern: string): string[] {
  const clean = pattern.replace(/^\.\//, '').replace(/\/$/, '');
  const body = clean.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*');
  const re = new RegExp(`(^|/)${body}(/|$)`);
  const hits = new Set<string>();
  for (const f of repoFiles(ctx)) {
    const m = f.match(re);
    if (m && m.index !== undefined) hits.add(f.slice(0, m.index + m[0].length).replace(/\/$/, ''));
  }
  return [...hits].sort();
}

function checkPath(ctx: CheckContext, span: Span): SpanResult {
  const t = span.text;
  if (t.startsWith('/') || t.startsWith('~')) return skipped(span, 'outside the repository');
  const patterns = expandPattern(t);
  const prefix = literalPrefix(patterns[0]?.replace(/^\.\//, '') ?? '');
  if (isIgnored(ctx, prefix)) return skipped(span, `inside ${prefix}/, which git ignores: generated output, not committed files`);
  const docDir = relative(ctx.root, dirname(join(ctx.root, ctx.docFile)));
  // Paths are read from the repository root, then from the file's own folder, then from each
  // sub-project ("src/services/" in a Backend section means backend/src/services/).
  const bases = ['', ...(docDir ? [docDir] : []), ...ctx.projectDirs];
  for (const base of bases) {
    const found = patterns.map((p) => findPath(ctx, base ? `${base}/${p}` : p));
    if (found.every((f) => f.length > 0)) {
      const all = found.flat();
      const shown = all.slice(0, 3).join(', ');
      const more = all.length > 3 ? ` and ${all.length - 3} more` : '';
      return ok(span, base ? `found under ${base}/: ${shown}${more}` : `${shown}${more}`);
    }
  }
  const missing = patterns.filter((p) => findPath(ctx, p).length === 0).join(', ');
  if (span.kind === 'link') return stale(span, `broken link: ${missing}`);

  const segments = t.replace(/^\.\//, '').replace(/\/$/, '').split('/');
  const first = segments[0] ?? '';
  if (segments.length === 1 && !t.endsWith('/')) {
    // A bare file name ("`receipt.json` records…") may live anywhere, or be produced at runtime.
    const anywhere = patterns.flatMap((p) => findAnywhere(ctx, p));
    return anywhere.length
      ? ok(span, `found at ${anywhere.slice(0, 3).join(', ')}${anywhere.length > 3 ? ` and ${anywhere.length - 3} more` : ''}`)
      : unconfirmed(span, `no file named ${first} in the repository`);
  }
  // "the pr-comments skill's references/pitfalls.md" is relative to somewhere else; look before calling it missing.
  const elsewhere = patterns.flatMap((p) => findAnywhere(ctx, p));
  if (elsewhere.length) return ok(span, `found at ${elsewhere.slice(0, 3).join(', ')}, not relative to ${ctx.docFile}`);
  // A missing leaf under a folder that exists means something moved or was deleted.
  // If even the first folder is absent, the path most likely names a place outside this repository.
  const anchored = segments.length === 1 || bases.some((b) => existsSync(join(ctx.root, b, first)));
  if (anchored) return stale(span, `not found: ${missing}`);
  // `helm install/upgrade`, `prettier/prettier`: wording or a lint rule id, not a repository path.
  if (/^@?[a-z][\w-]*\/[a-z][\w-]*$/.test(t)) return skipped(span, `reads as "${t.replace('/', ' or ')}" or a rule id, not a path`);
  return unconfirmed(span, `no ${first}/ in this repository; fine if it names a folder somewhere else`);
}

const YARN_BUILTINS = new Set([
  'install', 'add', 'remove', 'upgrade', 'up', 'init', 'dlx', 'why', 'info', 'workspace', 'workspaces', 'global', 'cache',
  'config', 'set', 'exec', 'node', 'bin', 'pack', 'publish', 'link', 'unlink', 'audit', 'outdated', 'create', 'import',
]);

function scriptOwners(ctx: CheckContext, script: string): string[] {
  return ctx.packages.filter((p) => script in p.scripts).map((p) => p.file);
}

function checkCommand(ctx: CheckContext, span: Span): SpanResult {
  const tokens = span.text.split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ''));
  const [bin, ...args] = tokens;
  if (!bin) return skipped(span, 'empty command');
  if (/<[^>]+>/.test(span.text)) return skipped(span, 'a template with placeholders, not a command to run');

  if (bin === 'yarn' || bin === 'pnpm' || bin === 'bun' || (bin === 'npm' && (args[0] === 'run' || args[0] === 'test'))) {
    let script = args[0] === 'run' ? args[1] : args[0];
    if (bin === 'npm' && args[0] === 'test') script = 'test';
    if (!script) return skipped(span, `plain \`${bin}\` installs dependencies`);
    if (bin !== 'npm' && YARN_BUILTINS.has(script)) return skipped(span, `\`${bin} ${script}\` is a built-in command`);
    const owners = scriptOwners(ctx, script);
    return owners.length
      ? ok(span, `script "${script}" in ${owners.join(', ')}`)
      : stale(span, `no package.json defines a "${script}" script`);
  }
  if (bin === 'npm') return skipped(span, `\`npm ${args[0] ?? ''}\` is a built-in command`);

  const shellScript = bin === 'bash' || bin === 'sh' ? args[0] : bin.startsWith('./') ? bin : undefined;
  if (shellScript) {
    const sub = bin === 'bash' || bin === 'sh' ? args[1] : args[0];
    const file = join(ctx.root, shellScript.replace(/^\.\//, ''));
    if (!existsSync(file)) return stale(span, `${shellScript} does not exist`);
    if (!sub || sub.startsWith('-')) return ok(span, `${shellScript} exists`);
    const lines = readFileSync(file, 'utf8').split('\n');
    const name = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A hyphen continues a shell function name, so `down` must not match `down-light`.
    const end = '(?![\\w-])';
    const def = new RegExp(`^\\s*(function\\s+${name}${end}|${name}\\s*\\(\\)|["']?${name}["']?${end}(\\s*\\|[^)]*)?\\))`);
    const at = lines.findIndex((l) => def.test(l));
    return at >= 0
      ? ok(span, `${shellScript}:${at + 1} ${lines[at]?.trim()}`)
      : stale(span, `${shellScript} defines no "${sub}" subcommand`);
  }
  if (bin === 'make') {
    const target = args[0];
    const makefile = join(ctx.root, 'Makefile');
    if (!existsSync(makefile)) return stale(span, 'no Makefile');
    if (!target) return ok(span, 'Makefile exists');
    const lines = readFileSync(makefile, 'utf8').split('\n');
    const at = lines.findIndex((l) => l.startsWith(`${target}:`));
    return at >= 0 ? ok(span, `Makefile:${at + 1}`) : stale(span, `Makefile has no "${target}" target`);
  }
  if (bin === 'node' && args[0]) return checkPath(ctx, { kind: 'path', text: args[0] });
  return skipped(span, `external command \`${bin}\``);
}

type Grep = { hit: string } | { miss: true } | { error: string };

/** `git grep` over tracked and untracked code, never markdown. Exit 1 means no match; anything else is an error. */
function gitGrep(ctx: CheckContext, args: string[]): { status: 'match'; stdout: string } | { status: 'miss' } | { status: 'error'; message: string } {
  const res = spawnSync('git', ['grep', '-I', '--untracked', '-F', ...args, '--', '.', ':(exclude,glob)**/*.md', ':(exclude,glob)**/*.mdx'], {
    cwd: ctx.root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (res.status === 0) return { status: 'match', stdout: res.stdout };
  if (res.status === 1) return { status: 'miss' };
  return { status: 'error', message: (res.stderr || res.error?.message || `git grep exited ${res.status}`).split('\n')[0] ?? 'git grep failed' };
}

/** First matching line in code, as `file:line text`. */
function grepFirst(ctx: CheckContext, needle: string, word: boolean): Grep {
  const res = gitGrep(ctx, ['-n', ...(word ? ['-w'] : []), '-e', needle]);
  if (res.status === 'error') return { error: res.message };
  if (res.status === 'miss') return { miss: true };
  const first = res.stdout.split('\n').find(Boolean) ?? '';
  const [file, line, ...rest] = first.split(':');
  return { hit: `${file}:${line} ${rest.join(':').trim().slice(0, 80)}` };
}

/** Tracked and untracked file paths containing `needle`, for naming conventions like `add_` migrations. */
function fileNamesWith(ctx: CheckContext, needle: string): string[] {
  return repoFiles(ctx).filter((f) => f.split('/').pop()?.includes(needle));
}

function checkSymbol(ctx: CheckContext, span: Span): SpanResult {
  if (!ctx.isGit) return skipped(span, 'identifier lookups need a git repository');
  const call = span.text.endsWith('()');
  const name = call ? span.text.slice(0, -2) : span.text;
  // `exports.up` must match as written: its last part alone ("up") would match almost anything.
  const needles = [call ? `${name}(` : name];
  const last = name.split('.').pop() ?? name;
  if (name.includes('.') && last.length >= 5) needles.push(call ? `${last}(` : last);
  for (const needle of needles) {
    const res = grepFirst(ctx, needle, !call && !needle.includes('.'));
    if ('error' in res) return skipped(span, `lookup failed: ${res.error}`);
    if ('hit' in res) return ok(span, res.hit);
  }
  const files = fileNamesWith(ctx, name);
  if (files.length) return ok(span, `in file names: ${files.slice(0, 2).join(', ')}${files.length > 2 ? ` and ${files.length - 2} more` : ''}`);
  return unconfirmed(span, `"${needles[0]}" appears in no code file or file name`);
}

function checkEnv(ctx: CheckContext, span: Span): SpanResult {
  if (!ctx.isGit) return skipped(span, 'lookups need a git repository');
  const [key, value] = span.text.split('=');
  if (!key || !value) return skipped(span, 'not an assignment');
  const res = gitGrep(ctx, ['-l', '-w', '-e', key]);
  if (res.status === 'error') return skipped(span, `lookup failed: ${res.message}`);
  if (res.status === 'miss') return unconfirmed(span, `${key} appears in no code file`);
  const files = res.stdout.split('\n').filter(Boolean);
  const withValue = files.find((f) => readFileSync(join(ctx.root, f), 'utf8').includes(value));
  return withValue ? ok(span, `${key} and "${value}" in ${withValue}`) : unconfirmed(span, `${key} is used in ${files.slice(0, 2).join(', ')} but "${value}" never appears with it`);
}

const PACKAGES: Record<string, string> = {
  'next.js': 'next', react: 'react', mui: '@mui/material', 'material ui': '@mui/material', typescript: 'typescript',
  express: 'express', 'express.js': 'express', recoil: 'recoil', bullmq: 'bullmq', knex: 'knex', sequelize: 'sequelize',
  cypress: 'cypress', jest: 'jest', vitest: 'vitest', vite: 'vite', vue: 'vue', tailwind: 'tailwindcss',
  tailwindcss: 'tailwindcss', prisma: 'prisma', playwright: '@playwright/test', eslint: 'eslint',
};
const IMAGES: Record<string, RegExp> = {
  postgresql: /image:\s*["']?(?:[\w.-]+\/)?(?:postgres|postgis|postgresql)[\w/-]*:(\d+)/gi,
  postgres: /image:\s*["']?(?:[\w.-]+\/)?(?:postgres|postgis|postgresql)[\w/-]*:(\d+)/gi,
  redis: /image:\s*["']?(?:[\w.-]+\/)?(?:redis|valkey)[\w/-]*:(\d+)/gi,
};

/** Major version a semver range starts at: "^15.5.21" gives 15, ">=24" gives 24. */
export function majorOf(range: string): number | null {
  const m = range.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function composeFiles(ctx: CheckContext): string[] {
  return globSync(['*compose*.y*ml', '*/*compose*.y*ml', '**/Dockerfile*'], { cwd: ctx.root, exclude: skipIgnored });
}

function checkVersion(ctx: CheckContext, span: Span): SpanResult {
  const m = span.text.match(/^(.+?)\s+v?(\d+)(\+)?$/);
  if (!m) return skipped(span, 'not a version');
  const tech = (m[1] ?? '').toLowerCase();
  const claimed = Number(m[2]);
  const atLeast = Boolean(m[3]);

  if (tech === 'node' || tech === 'node.js') {
    const engines = ctx.packages.filter((p) => p.engines.node).map((p) => ({ where: `${p.file} engines.node "${p.engines.node}"`, major: majorOf(p.engines.node ?? '') }));
    const docker = composeFiles(ctx).flatMap((f) =>
      [...readFileSync(join(ctx.root, f), 'utf8').matchAll(/FROM\s+(?:[\w.-]+\/)?node:(\d+)/gi)].map((x) => ({ where: `${f} FROM node:${x[1]}`, major: Number(x[1]) })),
    );
    const nvm = ['.nvmrc', '.node-version'].filter((f) => existsSync(join(ctx.root, f))).map((f) => {
      const v = readFileSync(join(ctx.root, f), 'utf8').trim();
      return { where: `${f} ${v}`, major: majorOf(v) };
    });
    const found = [...engines, ...nvm, ...docker].filter((x) => x.major !== null);
    if (!found.length) return unconfirmed(span, 'no engines.node, .nvmrc or node Docker image to compare with');
    const floors = [...engines, ...nvm].filter((x) => x.major !== null);
    // "Node 24+" is stale when any package already needs more: someone on 24 could not run it.
    const required = Math.max(...(floors.length ? floors : found).map((x) => x.major ?? 0));
    const list = found.map((x) => x.where).join('; ');
    if (atLeast) {
      if (required === claimed) return ok(span, list);
      const needs = floors.filter((x) => x.major === required).map((x) => x.where).join('; ');
      return stale(span, `the repository requires Node ${required}: ${needs || list}`);
    }
    return found.some((x) => x.major === claimed) ? ok(span, list) : stale(span, `repository uses ${list}`);
  }
  const image = IMAGES[tech];
  if (image) {
    const found = composeFiles(ctx).flatMap((f) => [...readFileSync(join(ctx.root, f), 'utf8').matchAll(image)].map((x) => ({ where: `${f} ${x[0].replace(/^image:\s*/i, '')}`, major: Number(x[1]) })));
    if (!found.length) return unconfirmed(span, `no ${tech} image in compose or Dockerfiles`);
    const match = found.filter((x) => (atLeast ? x.major >= claimed : x.major === claimed));
    return match.length === found.length ? ok(span, found.map((x) => x.where).join('; ')) : stale(span, `images: ${found.map((x) => x.where).join('; ')}`);
  }
  const pkg = PACKAGES[tech];
  if (!pkg) return skipped(span, `no rule for ${m[1]}`);
  const users = ctx.packages.filter((p) => p.deps[pkg]).map((p) => ({ where: `${p.file} ${pkg} "${p.deps[pkg]}"`, major: majorOf(p.deps[pkg] ?? '') }));
  if (!users.length) return unconfirmed(span, `no package.json depends on ${pkg}`);
  const bad = users.filter((u) => u.major !== null && (atLeast ? u.major < claimed : u.major !== claimed));
  return bad.length ? stale(span, bad.map((u) => u.where).join('; ')) : ok(span, users.map((u) => u.where).join('; '));
}

export function checkSpan(ctx: CheckContext, span: Span): SpanResult {
  switch (span.kind) {
    case 'path':
    case 'link':
      return checkPath(ctx, span);
    case 'command':
      return checkCommand(ctx, span);
    case 'symbol':
      return checkSymbol(ctx, span);
    case 'env':
      return checkEnv(ctx, span);
    case 'version':
      return checkVersion(ctx, span);
  }
}
