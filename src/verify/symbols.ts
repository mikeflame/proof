import { posix } from 'node:path';
import { gitGrep, type GrepHit } from '../core/git.ts';
import { classifyOccurrence, ownerOf } from '../core/syntax.ts';
import { type Evidence, type EvidenceLevel, LEVEL_RANK, type Span, type SpanResult, VERIFYING_LEVELS } from '../model.ts';
import { qualifiedName } from '../parse/classify.ts';
import { blocked, type CheckContext, clip, docExclude, join, notChecked, stale, unconfirmed, verified } from './util.ts';

/** Prose, docs and lockfiles never count as evidence that code defines a name. */
const NOT_CODE = [':(exclude,glob)**/*.md', ':(exclude,glob)**/*.mdx', ':(exclude,glob)**/*.txt', ':(exclude,glob)**/*.rst', ':(exclude,glob)**/*.lock', ':(exclude,glob)**/package-lock.json', ':(exclude,glob)**/CHANGELOG*', ':(exclude,glob)**/*.proof.json'];
const MAX_HITS = 400;
const MAX_FILES_PARSED = 40;
const MAX_CONFIG_FILES = 300;
const MAX_CONFIG_BYTES = 256 * 1024;

const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
const LONG_FLAG = /^--[A-Za-z][\w-]*$/;
const SHORT_FLAG = /^-[A-Za-z]$/;
const HOST = /^(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|app|ai|co|cloud|sh|gg|me|us|uk|de|xyz|run|page|site|tech|so|gov|edu)$/;
const TEST_PATH = /^((?:Test|Benchmark|Fuzz|Example)[A-Z_]\w*)\/(.+)$/;
const KEY = /^[a-z_][a-z0-9_]*$/;
const SLASH_COMMAND = /^\/([a-z][\w-]*)(?::([\w-]+))?$/;
/** Claude Code's own commands: nothing in a repository defines them. */
const BUILTIN_COMMANDS = new Set(['init', 'memory', 'context', 'compact', 'config', 'doctor', 'clear', 'help', 'model', 'review', 'agents', 'mcp', 'plugin', 'permissions', 'hooks', 'status', 'cost', 'login', 'logout', 'resume', 'rewind', 'export', 'add-dir', 'ide', 'vim', 'terminal-setup', 'bug', 'release-notes', 'pr-comments', 'security-review', 'statusline', 'todos', 'usage', 'output-style', 'fast', 'effort', 'loop', 'workflows', 'artifacts', 'import', 'upgrade']);
const LITERALS = new Set(['true', 'false', 'null', 'nil', 'None', 'True', 'False', 'undefined', 'NaN', 'yes', 'no', 'on', 'off']);
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Classified {
  hit: GrepHit;
  level: EvidenceLevel;
}

/** One piece of evidence a strategy found, with the sentence that explains it. */
interface Found {
  level: EvidenceLevel;
  evidence: Evidence[];
  why: string;
}

/** A match is token-bounded when the characters around it cannot continue the name. */
function bounded(hit: GrepHit, needle: string, tokenChars = /[\w$]/): boolean {
  const at = hit.column - 1;
  const before = hit.text[at - 1] ?? '';
  const after = hit.text[at + needle.length] ?? '';
  // `checkSchema(` ends in punctuation: what follows it is an argument, not more of the name.
  const open = !tokenChars.test(needle[needle.length - 1] ?? '');
  return !tokenChars.test(before) && (open || !tokenChars.test(after)) && before !== '.';
}

/** Classify grep hits through syntax trees, likeliest definitions first, within a parse budget. */
async function classifyHits(ctx: CheckContext, hits: GrepHit[], name: string, opts: { all?: boolean; prefer?: string } = {}): Promise<Classified[]> {
  const last = name.split('.').pop() ?? name;
  const defLike = new RegExp(`\\b(func|function|def|class|interface|type|struct|enum|trait|impl|const|let|var|fn|module)\\s+(\\([^)]*\\)\\s*)?${esc(last)}\\b`);
  const score = (h: GrepHit) => Number(defLike.test(h.text)) * 2 + Number(Boolean(opts.prefer && h.text.includes(opts.prefer)));
  const ordered = [...hits].sort((a, b) => score(b) - score(a));
  const files = new Set<string>();
  const out: Classified[] = [];
  for (const hit of ordered) {
    if (!files.has(hit.file)) {
      if (files.size >= MAX_FILES_PARSED) continue;
      files.add(hit.file);
    }
    out.push({ hit, level: await classifyOccurrence(ctx.syntax, ctx.repo, hit.file, hit.line, hit.column, name) });
    if (!opts.all && out.some((c) => c.level === 'definition')) break;
  }
  return out;
}

const ev = (c: Classified): Evidence => ({ ref: `${c.hit.file}:${c.hit.line}`, excerpt: clip(c.hit.text), level: c.level });

const asFound = (list: Classified[], scopeNote = ''): Found[] =>
  list.map((c) => ({ level: c.level, evidence: [ev(c)], why: `${c.level} at ${c.hit.file}:${c.hit.line}${scopeNote}` }));

/**
 * Turn what the strategies found into a span result. Absence claims are contradicted only by a
 * definition; a use or declaration of the same name may be something else by that name.
 */
function decide(span: Span, found: Found[], name: string, missing: string): SpanResult {
  const top = found.reduce<Found | null>((acc, f) => (!acc || LEVEL_RANK[f.level] > LEVEL_RANK[acc.level] ? f : acc), null);
  if (span.expect === 'absent') {
    const defined = found.find((f) => f.level === 'definition');
    if (defined) return stale(span, `said to be gone, but ${name} is still there: ${defined.why}`, defined.evidence);
    const live = found.find((f) => VERIFYING_LEVELS.has(f.level));
    if (live) return unconfirmed(span, `said to be gone, but ${name} is still ${live.level === 'declaration' ? 'declared' : 'used'}: ${live.why}`, live.evidence, live.level);
    const mentions = found.length ? `; ${found.length} mention${found.length === 1 ? '' : 's'} in comments or strings remain` : '';
    return verified(span, 'definition', [{ ref: `no definition or use of ${name}`, level: 'definition' }], `absent, as the statement says${mentions}`);
  }
  if (!top) return unconfirmed(span, missing);
  const evidence = [...top.evidence, ...found.filter((f) => f !== top && f.level === top.level).flatMap((f) => f.evidence)].slice(0, 2);
  if (VERIFYING_LEVELS.has(top.level)) return verified(span, top.level, evidence, top.why);
  if (top.level === 'none' || !top.evidence.length) return unconfirmed(span, top.why, evidence, top.level);
  const where = top.level === 'comment' ? 'comments' : 'strings or longer names';
  return unconfirmed(span, `${name} appears only in ${where} (${top.evidence[0]?.ref ?? ''})`, evidence, top.level);
}

/** Folders a qualified name's scope may name: `internal/testgit`, `a.b` as `a/b`, or a package folder called `testgit`. */
function scopeDirs(ctx: CheckContext, scope: string): string[] {
  const out = new Set<string>();
  for (const s of [scope, scope.replace(/\./g, '/')]) {
    for (const base of ['', ctx.pathBase, ...ctx.repo.projectDirs]) {
      const d = join(base, s);
      if (ctx.repo.dirs.has(d)) out.add(d);
    }
  }
  if (!scope.includes('/') && !scope.includes('.')) for (const d of ctx.repo.dirs) if (posix.basename(d) === scope) out.add(d);
  // A module path such as `github.com/x/y/internal/testgit` ends in a folder of this repository.
  if (scope.includes('/') && !out.size) for (const d of ctx.repo.dirs) if (scope.endsWith(`/${d}`)) out.add(d);
  return [...out];
}

type Grep = GrepHit[] | { error: string };

/** A git lookup that failed: the span reports not checked with this message, never "not found" (D4). */
export class LookupError extends Error {}

function grep(ctx: CheckContext, needle: string, word: boolean, pathspec: string[] = ['.'], limit = MAX_HITS): Grep {
  const res = gitGrep(ctx.repo.root, needle, { word, pathspec: [...pathspec, ...NOT_CODE, ...ctx.repo.generatedExcludes, ...docExclude(ctx)], limit });
  if (res.status === 'error') return { error: res.message };
  return res.status === 'miss' ? [] : res.lines;
}

async function grepClassified(ctx: CheckContext, needle: string, word: boolean, pathspec: string[] = ['.'], opts: { tokenChars?: RegExp; all?: boolean; prefer?: string; name?: string } = {}): Promise<Classified[] | { error: string }> {
  const hits = grep(ctx, needle, word, pathspec);
  if ('error' in hits) return hits;
  const kept = word && !opts.tokenChars ? hits : hits.filter((h) => bounded(h, needle, opts.tokenChars));
  return classifyHits(ctx, kept, opts.name ?? needle, opts);
}

/** An identifier, a dotted name (`req.sessionId`) or a qualified name (`internal/testgit.RealGit`). */
export async function checkSymbol(ctx: CheckContext, span: Span): Promise<SpanResult> {
  if (!ctx.repo.isGit) return blocked(span, 'identifier lookups need a git repository');
  const call = span.text.endsWith('()');
  const text = call ? span.text.slice(0, -2) : span.text;

  if (SLASH_COMMAND.test(text)) return checkSlashCommand(ctx, span, text);
  const test = text.match(TEST_PATH);
  if (test) return checkSubtest(ctx, span, test[1] ?? '', test[2] ?? '');
  if (LONG_FLAG.test(text)) return checkFlag(ctx, span, text);
  if (LITERALS.has(text)) return notChecked(span, 'a literal value, not a name');
  if (SHORT_FLAG.test(text)) return blocked(span, 'a short flag; which command it belongs to is in the sentence');
  if (KEBAB.test(text) || HOST.test(text) || text.includes('<') || text.startsWith('refs/')) return checkLiteral(ctx, span, text);

  const q = qualifiedName(text);
  if (q && (q.scope.includes('/') || scopeDirs(ctx, q.scope).length)) {
    const dirs = scopeDirs(ctx, q.scope);
    if (dirs.length) {
      const list = await grepClassified(ctx, q.name, true, dirs);
      if ('error' in list) return blocked(span, `lookup failed: ${list.error}`);
      const note = ` in ${dirs.slice(0, 2).join(', ')}`;
      // `config.get` where a `config/` folder exists but `config` is a library: read it as a dotted name instead.
      if (list.length || q.scope.includes('/')) return decide(span, asFound(list, note), q.name, `${q.name} appears in no code file${note}`);
    }
    if (q.scope.includes('/')) return span.expect === 'absent' ? verified(span, 'definition', [{ ref: `no ${q.scope}/`, level: 'definition' }], 'absent, as the statement says') : stale(span, `no package folder ${q.scope}/ for ${q.name}`);
  }

  if (text.includes('.')) return checkDotted(ctx, span, text);
  if (/^[A-Za-z][A-Za-z0-9]*_$/.test(text)) return checkPrefix(ctx, span, text);

  const list = await grepClassified(ctx, call ? `${text}(` : text, !call, ['.'], { name: text });
  if ('error' in list) return blocked(span, `lookup failed: ${list.error}`);
  if (list.length || span.expect === 'absent') return decide(span, asFound(list), text, `${text} appears in no code file`);
  // A naming convention (`add_` migrations) shows up in file names, not in code.
  const named = ctx.repo.files.filter((f) => posix.basename(f).includes(text));
  if (named.length) return verified(span, 'reference', named.slice(0, 2).map((f) => ({ ref: f, level: 'reference' })), `used in file names: ${named.slice(0, 2).join(', ')}${named.length > 2 ? ` and ${named.length - 2} more` : ''}`);
  return unconfirmed(span, `${text} appears in no code file or file name`);
}

/**
 * `Type.member`, `pkg.Type.member`, `table.column`, `config.key.path`, or `obj.field` as written.
 * Each reading is tried and the strongest evidence wins; the last part alone never proves the whole.
 */
async function checkDotted(ctx: CheckContext, span: Span, text: string): Promise<SpanResult> {
  const segs = text.split('.');
  const pkgDirs = segs.length >= 3 ? scopeDirs(ctx, segs[0] ?? '') : [];
  const rest = pkgDirs.length ? segs.slice(1) : segs;
  const found: Found[] = [];

  const literal = await grepClassified(ctx, text, false);
  if ('error' in literal) return blocked(span, `lookup failed: ${literal.error}`);
  found.push(...asFound(literal));

  const owner = rest[rest.length - 2] ?? '';
  const member = rest[rest.length - 1] ?? '';
  if (/^[A-Z]/.test(owner) && member) found.push(...(await memberOf(ctx, owner, member, pkgDirs)));
  const keys = segs.every((s) => KEY.test(s));
  if (keys && segs.length === 2) found.push(...sqlColumn(ctx, segs[0] ?? '', segs[1] ?? ''));
  if (keys && !found.some((f) => f.level === 'definition' || f.level === 'declaration')) found.push(...configKey(ctx, segs));

  if (found.some((f) => VERIFYING_LEVELS.has(f.level) || f.level === 'comment') || span.expect === 'absent') return decide(span, found, text, '');
  const reasoned = found.find((f) => f.level === 'substring' && !f.evidence.length);
  if (reasoned) return unconfirmed(span, `${text}: ${reasoned.why}`, [], 'substring');
  const last = segs[segs.length - 1] ?? text;
  const other = await grepClassified(ctx, last, true);
  if ('error' in other) throw new LookupError(other.error);
  if (other.length) {
    const sample = other[0];
    return unconfirmed(span, `${text} appears nowhere; ${last} exists elsewhere${sample ? ` (${sample.hit.file}:${sample.hit.line})` : ''}, on something not shown to be ${segs.slice(0, -1).join('.')}`, other.slice(0, 2).map((c) => ({ ...ev(c), level: 'substring' })), 'substring');
  }
  return decide(span, found, text, `${text} appears in no code file`);
}

/** `Executor.Run`: a definition of `Run` whose owning type, read from the syntax tree, is `Executor`. */
async function memberOf(ctx: CheckContext, owner: string, member: string, dirs: string[]): Promise<Found[]> {
  const list = await grepClassified(ctx, member, true, dirs.length ? dirs : ['.'], { all: true, prefer: owner });
  if ('error' in list) throw new LookupError(list.error);
  const out: Found[] = [];
  const others = new Set<string>();
  for (const c of list.filter((x) => x.level === 'definition')) {
    const of = await ownerOf(ctx.syntax, c.hit.file, c.hit.line, c.hit.column, member);
    if (of === owner) return [{ level: 'definition', evidence: [ev(c)], why: `${member} is defined on ${owner} at ${c.hit.file}:${c.hit.line}` }];
    if (of) others.add(of);
    // A definition whose owner cannot be read proves nothing about `Owner.member`.
    else out.push({ level: 'substring', evidence: [{ ...ev(c), level: 'substring' }], why: `${member} is defined at ${c.hit.file}:${c.hit.line}, but not shown to be a member of ${owner}` });
  }
  if (others.size && !out.length) out.push({ level: 'substring', evidence: [], why: `${member} is defined on ${[...others].slice(0, 3).join(', ')}, not on ${owner}` });
  return out;
}

const SQL_COLUMN = /^\s*\(?\s*["`[]?(\w+)["`\]]?\s+(?:INTEGER|INT|BIGINT|SMALLINT|TINYINT|TEXT|VARCHAR|CHAR|CHARACTER|BOOLEAN|BOOL|REAL|DOUBLE|FLOAT|NUMERIC|DECIMAL|DATE|TIME|TIMESTAMP|TIMESTAMPTZ|DATETIME|INTERVAL|JSON|JSONB|UUID|BLOB|BYTEA|SERIAL|BIGSERIAL|CITEXT|INET|MONEY)\b/i;
const CREATE_TABLE = /\bCREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?["`[]?(\w+)/i;

/** `runs.started_at`: a column the schema declares on that table, in a migration, a .sql file or SQL in a string. */
function sqlColumn(ctx: CheckContext, table: string, column: string): Found[] {
  const hits = grep(ctx, column, true);
  if ('error' in hits) throw new LookupError(hits.error);
  const t = esc(table);
  const c = esc(column);
  const alter = new RegExp(`\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:\\w+\\.)?["\`[]?${t}["\`\\]]?\\s+ADD\\s+(?:COLUMN\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?["\`[]?${c}\\b`, 'i');
  const use = new RegExp(`\\b(?:UPDATE|INTO|FROM|JOIN)\\s+["\`[]?${t}\\b`);
  const out: Found[] = [];
  for (const hit of hits) {
    const at = `${hit.file}:${hit.line}`;
    if (alter.test(hit.text)) return [{ level: 'declaration', evidence: [{ ref: at, excerpt: clip(hit.text), level: 'declaration' }], why: `column ${column} added to ${table} at ${at}` }];
    if (SQL_COLUMN.exec(hit.text)?.[1] === column) {
      const lines = (ctx.repo.read(hit.file) ?? '').split('\n');
      for (let i = hit.line - 2; i >= 0 && i >= hit.line - 400; i--) {
        const m = CREATE_TABLE.exec(lines[i] ?? '');
        if (!m) continue;
        if (m[1] === table) return [{ level: 'declaration', evidence: [{ ref: at, excerpt: clip(hit.text), level: 'declaration' }], why: `column ${column} of table ${table} at ${at}` }];
        break;
      }
    }
    if (use.test(hit.text) && !out.length) out.push({ level: 'reference', evidence: [{ ref: at, excerpt: clip(hit.text), level: 'reference' }], why: `SQL on ${table} uses ${column} at ${at}` });
  }
  return out;
}

const configCache = new WeakMap<object, { file: string; data: unknown }[]>();

/** YAML, TOML and JSON files of the repository, parsed once per run; templated files that do not parse are skipped. */
function configFiles(ctx: CheckContext): { file: string; data: unknown }[] {
  const cached = configCache.get(ctx.repo);
  if (cached) return cached;
  const files = ctx.repo
    .find(/\.(ya?ml|toml|json)$/)
    .filter((f) => !/(^|\/)(package-lock\.json|pnpm-lock\.yaml|composer\.lock|tsconfig\.tsbuildinfo)$/.test(f) && !/(^|\/)(fixtures?|testdata|__snapshots__)\//.test(f))
    .slice(0, MAX_CONFIG_FILES);
  const out: { file: string; data: unknown }[] = [];
  for (const file of files) {
    const text = ctx.repo.read(file);
    if (!text || text.length > MAX_CONFIG_BYTES) continue;
    const data = ctx.repo.structured(file, { quiet: true });
    if (data && typeof data === 'object') out.push({ file, data });
  }
  configCache.set(ctx.repo, out);
  return out;
}

function hasPath(data: unknown, segs: string[]): boolean {
  if (!segs.length) return true;
  if (Array.isArray(data)) return data.some((d) => hasPath(d, segs));
  if (!data || typeof data !== 'object') return false;
  const [head = '', ...tail] = segs;
  return head in data && hasPath((data as Record<string, unknown>)[head], tail);
}

/** Go: the type of a struct field tagged `yaml:"seg"`, read from the field line. */
const taggedField = (seg: string) => new RegExp(`^\\s*\\w+\\s+([\\w.*\\[\\]]+)\\s+\`[^\`]*\\b(?:yaml|json|toml|mapstructure|koanf|hcl):"${esc(seg)}[,"]`);

/**
 * `pr.base_branch`: the key path in a YAML, TOML or JSON file of the repository, or a chain of Go struct
 * fields tagged with each part (`PR PRConfig \`yaml:"pr"\`` then `BaseBranch string \`yaml:"base_branch"\``).
 */
function configKey(ctx: CheckContext, segs: string[]): Found[] {
  const path = segs.join('.');
  for (const { file, data } of configFiles(ctx)) {
    if (!hasPath(data, segs)) continue;
    const last = segs[segs.length - 1] ?? '';
    const line = (ctx.repo.read(file) ?? '').split('\n').findIndex((l) => new RegExp(`^\\s*-?\\s*["']?${esc(last)}["']?\\s*[:=]`).test(l));
    const ref = line >= 0 ? `${file}:${line + 1}` : file;
    return [{ level: 'declaration', evidence: [{ ref, level: 'declaration' }], why: `key ${path} in ${ref}` }];
  }
  // The struct chain: the field tagged with the first part anywhere, then each next part inside the type the previous field names.
  let types: string[] | null = null;
  let at = '';
  for (const seg of segs) {
    const hits = grep(ctx, `:"${seg}`, false, ['*.go']);
    if ('error' in hits) throw new LookupError(hits.error);
    if (!hits.length) return [];
    const fields: { h: GrepHit; m: RegExpExecArray | null }[] = hits.map((h) => ({ h, m: taggedField(seg).exec(h.text) })).filter((x) => x.m);
    const allowed: string[] | null = types;
    const inType: typeof fields = allowed === null ? fields : fields.filter((x) => allowed.includes(structOf(ctx, x.h.file, x.h.line) ?? ''));
    const first = inType[0];
    if (!first?.m) return [];
    at = `${first.h.file}:${first.h.line}`;
    types = [...new Set(inType.map((x): string => (x.m?.[1] ?? '').replace(/^(\*|\[\]|map\[[^\]]*\])+/, '').split('.').pop() ?? ''))];
  }
  return [{ level: 'declaration', evidence: [{ ref: at, level: 'declaration' }], why: `config key ${path}: a chain of tagged struct fields ending at ${at}` }];
}

/** The Go struct type a field line sits in: the nearest `type X struct {` above it. */
function structOf(ctx: CheckContext, file: string, line: number): string | null {
  const lines = (ctx.repo.read(file) ?? '').split('\n');
  for (let i = line - 2; i >= 0; i--) {
    const m = /^type\s+(\w+)\s+struct\b/.exec(lines[i] ?? '');
    if (m) return m[1] ?? null;
    if (/^}/.test(lines[i] ?? '')) return null;
  }
  return null;
}

/** `TestFoo/sub_case`: the test function and a subtest of that name (Go turns spaces into underscores). */
async function checkSubtest(ctx: CheckContext, span: Span, fn: string, sub: string): Promise<SpanResult> {
  const list = await grepClassified(ctx, fn, true);
  if ('error' in list) return blocked(span, `lookup failed: ${list.error}`);
  const def = list.find((c) => c.level === 'definition');
  if (!def || span.expect === 'absent') return decide(span, asFound(list), fn, `test ${fn} appears in no code file`);
  const text = ctx.repo.read(def.hit.file) ?? '';
  const idx = [...new Set([sub, sub.replace(/_/g, ' ')])].map((v) => text.indexOf(`"${v}`)).find((i) => i >= 0);
  if (idx === undefined) return unconfirmed(span, `${fn} exists (${def.hit.file}:${def.hit.line}) but has no subtest named "${sub}"`, [ev(def)], 'reference');
  const line = text.slice(0, idx).split('\n').length;
  return verified(span, 'definition', [ev(def), { ref: `${def.hit.file}:${line}`, level: 'definition' }], `subtest of ${fn} at ${def.hit.file}:${line}`);
}

/**
 * `--force`: the flag as an exact string in code (`"--force"` or `"force"`), which is how command-line
 * libraries register flags and how code passes them on. The same flag in a shell line belongs to some other tool.
 */
function checkFlag(ctx: CheckContext, span: Span, flag: string): SpanResult {
  const name = flag.replace(/^-+/, '');
  const found = stringInCode(ctx, flag) ?? stringInCode(ctx, name);
  if (span.expect === 'absent') return found ? unconfirmed(span, `said to be gone, but ${flag} is still a string in code at ${found.ref}`, [found], 'reference') : verified(span, 'definition', [{ ref: `no string ${flag} in code`, level: 'definition' }], 'absent, as the statement says');
  return found ? verified(span, 'reference', [found], `a string in code at ${found.ref}`) : unconfirmed(span, `no code spells ${flag} as a string ("${flag}" or "${name}")`);
}

/**
 * A kebab-case name, a host, a git ref or a template such as `question-<id>`: names that live in strings,
 * folder names and config, never as identifiers.
 */
async function checkLiteral(ctx: CheckContext, span: Span, text: string): Promise<SpanResult> {
  const template = text.includes('<');
  const literal = template ? text.slice(0, text.indexOf('<')) : text;
  if (literal.length < 3) return blocked(span, 'a template with too little literal text to look up');
  if (!template && KEBAB.test(text)) {
    const named = [...ctx.repo.dirs, ...ctx.repo.files].filter((f) => posix.basename(f).replace(/\.\w+$/, '') === text);
    if (named.length && span.expect !== 'absent') return verified(span, 'definition', named.slice(0, 2).map((f) => ({ ref: f, level: 'definition' })), `named ${named.slice(0, 2).join(', ')}`);
  }
  const hits = grep(ctx, literal, false);
  if ('error' in hits) return blocked(span, `lookup failed: ${hits.error}`);
  const kept = hits.filter((h) => {
    const before = h.text[h.column - 2] ?? '';
    const after = h.text[h.column - 1 + literal.length] ?? '';
    return !/[\w$-]/.test(before) && (template || !/[\w$-]/.test(after));
  });
  const list = await classifyHits(ctx, kept, literal);
  return decide(span, asFound(list), text, `${literal} appears in no code, config or folder name`);
}

/** `"answer"`: the value as an exact string literal in code, or null. Quotes of any kind count. */
export function stringInCode(ctx: CheckContext, value: string, pathspec: string[] = ['.']): Evidence | null {
  const hits = grep(ctx, value, false, pathspec, 2000);
  if ('error' in hits) throw new LookupError(hits.error);
  const hit = hits.find((h) => {
    const before = h.text[h.column - 2] ?? '';
    const after = h.text[h.column - 1 + value.length] ?? '';
    // `Use: "answer [flags]"` registers a subcommand with its usage after it.
    return /["'`]/.test(before) && (/["'`]/.test(after) || (/\s/.test(after) && !value.startsWith('-')));
  });
  return hit ? { ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: 'reference' } : null;
}

/** Code text the classifier could not type (`### Review conversation`): found verbatim outside comments, it is a reference. */
export async function textInCode(ctx: CheckContext, text: string): Promise<Evidence | null> {
  const hits = grep(ctx, text, false, ['.'], 50);
  if ('error' in hits) throw new LookupError(hits.error);
  if (!hits.length) return null;
  for (const hit of hits.slice(0, 10)) {
    // Verbatim as code, or as a whole string (`"### Review conversation"`); inside a message or a comment it is prose.
    const level = await classifyOccurrence(ctx.syntax, ctx.repo, hit.file, hit.line, hit.column, text);
    if (VERIFYING_LEVELS.has(level)) return { ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: 'reference' };
  }
  return null;
}

/** `deprecated_`, `add_`: a naming prefix, seen at the start of names in code and in file names. */
async function checkPrefix(ctx: CheckContext, span: Span, prefix: string): Promise<SpanResult> {
  const hits = grep(ctx, prefix, false);
  if ('error' in hits) return blocked(span, `lookup failed: ${hits.error}`);
  const found: Found[] = [];
  const files = new Set<string>();
  for (const h of hits) {
    if (/[\w$]/.test(h.text[h.column - 2] ?? '') || files.size >= MAX_FILES_PARSED) continue;
    const token = h.text.slice(h.column - 1).match(/^[\w$]+/)?.[0] ?? prefix;
    files.add(h.file);
    const level = await classifyOccurrence(ctx.syntax, ctx.repo, h.file, h.line, h.column, token);
    found.push({ level, evidence: [{ ref: `${h.file}:${h.line}`, excerpt: clip(h.text), level }], why: `${token} at ${h.file}:${h.line}` });
    if (VERIFYING_LEVELS.has(level)) break;
  }
  const named = ctx.repo.files.filter((f) => new RegExp(`(^|[^A-Za-z0-9])${esc(prefix)}`).test(posix.basename(f)));
  if (named.length) found.push({ level: 'reference', evidence: named.slice(0, 2).map((f) => ({ ref: f, level: 'reference' })), why: `file names start with it: ${named.slice(0, 2).join(', ')}${named.length > 2 ? ` and ${named.length - 2} more` : ''}` });
  return decide(span, found, prefix, `no name or file in the repository starts with ${prefix}`);
}

/**
 * `/deploy` or `/proof:claude-md`: a command file or skill this repository defines (`.claude/commands/`,
 * `.claude/skills/`, a plugin's `skills/` or `commands/`), with the plugin prefix matched to its manifest.
 */
function checkSlashCommand(ctx: CheckContext, span: Span, text: string): SpanResult {
  const [, first = '', second] = SLASH_COMMAND.exec(text) ?? [];
  const plugin = second ? first : null;
  const name = second ?? first;
  if (!plugin && BUILTIN_COMMANDS.has(name)) return notChecked(span, 'a built-in Claude Code command');
  const definitions = ctx.repo.files.filter((f) => new RegExp(`(^|/)(skills/${esc(name)}/SKILL\\.md|commands/(.+/)?${esc(name)}\\.md|agents/${esc(name)}\\.md)$`).test(f));
  const inPlugin = plugin
    ? definitions.filter((f) => {
        const root = f.split(/\/(?:skills|commands|agents)\//)[0] ?? '';
        const manifest = ctx.repo.structured(`${root ? `${root}/` : ''}.claude-plugin/plugin.json`, { quiet: true }) as { name?: string } | null;
        return manifest?.name === plugin;
      })
    : definitions;
  if (span.expect === 'absent') return inPlugin.length ? stale(span, `said to be gone, but ${inPlugin[0]} still defines it`, [{ ref: inPlugin[0] ?? '', level: 'definition' }]) : verified(span, 'definition', [{ ref: `no command or skill ${name}`, level: 'definition' }], 'absent, as the statement says');
  if (inPlugin.length) return verified(span, 'definition', inPlugin.slice(0, 2).map((f) => ({ ref: f, level: 'definition' })), `defined by ${inPlugin[0]}${plugin ? ` in plugin ${plugin}` : ''}`);
  if (plugin && definitions.length) return unconfirmed(span, `${definitions[0]} defines ${name}, but not in a plugin named ${plugin}`, [{ ref: definitions[0] ?? '', level: 'reference' }], 'reference');
  if (!plugin) {
    // `/api`: a URL path the code serves or calls, spelled at the start of a string.
    const hits = grep(ctx, text, false, ['.'], 2000);
    if ('error' in hits) throw new LookupError(hits.error);
    const route = hits.find((h) => /["'`]/.test(h.text[h.column - 2] ?? '') && !/[\w-]/.test(h.text[h.column - 1 + text.length] ?? ''));
    if (route) return verified(span, 'reference', [{ ref: `${route.file}:${route.line}`, excerpt: clip(route.text), level: 'reference' }], `a URL path in code at ${route.file}:${route.line}`);
  }
  return unconfirmed(span, `no command, skill or agent in this repository defines ${text}${plugin ? '' : ', and no code spells it as a URL path'}; fine if it comes from a user-level skill or an installed plugin`);
}
