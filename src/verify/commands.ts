import { posix } from 'node:path';
import type { NodePackage } from '../core/repo.ts';
import { shellEntries } from '../core/syntax.ts';
import type { Evidence, Span, SpanResult } from '../model.ts';
import { KNOWN_TOOLS } from '../parse/classify.ts';
import { splitShell } from '../parse/shell.ts';
import { rakeTasks } from './rake.ts';
import { stringInCode } from './symbols.ts';
import { blocked, type CheckContext, join, notChecked, stale, unconfirmed, verified, workingDirs } from './util.ts';

const NPM_BUILTINS = new Set(['install', 'i', 'ci', 'init', 'exec', 'x', 'publish', 'pack', 'link', 'unlink', 'outdated', 'audit', 'update', 'up', 'version', 'view', 'info', 'ls', 'list', 'prune', 'dedupe', 'rebuild', 'login', 'logout', 'whoami', 'config', 'cache', 'doctor', 'help', 'uninstall', 'remove', 'rm', 'add', 'create', 'pkg']);
const YARN_BUILTINS = new Set(['install', 'add', 'remove', 'upgrade', 'up', 'init', 'dlx', 'why', 'info', 'workspaces', 'global', 'cache', 'config', 'set', 'exec', 'node', 'bin', 'pack', 'publish', 'link', 'unlink', 'audit', 'outdated', 'create', 'import', 'dedupe', 'npm', 'plugin', 'constraints', 'version', 'patch', 'rebuild', 'explain', 'upgrade-interactive', 'policies']);
const PNPM_BUILTINS = new Set(['install', 'i', 'add', 'remove', 'rm', 'update', 'up', 'exec', 'dlx', 'create', 'init', 'link', 'unlink', 'publish', 'pack', 'outdated', 'audit', 'why', 'list', 'ls', 'store', 'prune', 'fetch', 'rebuild', 'deploy', 'env', 'setup', 'config', 'patch', 'approve-builds']);
const BUN_BUILTINS = new Set(['install', 'i', 'add', 'remove', 'rm', 'update', 'x', 'create', 'init', 'build', 'link', 'unlink', 'pm', 'upgrade', 'outdated', 'publish', 'patch']);
const CARGO_BUILTINS = new Set(['build', 'b', 'check', 'c', 'clean', 'doc', 'd', 'new', 'init', 'add', 'remove', 'run', 'r', 'test', 't', 'bench', 'update', 'search', 'publish', 'install', 'uninstall', 'fmt', 'clippy', 'fix', 'tree', 'vendor', 'metadata', 'package', 'login', 'yank', 'owner', 'locate-project', 'generate-lockfile', 'fetch', 'rustc', 'rustdoc', 'version', 'help', 'nextest', 'watch', 'expand', 'deny', 'audit', 'llvm-cov', 'miri', 'machete', 'udeps', 'outdated']);
const MAVEN_PHASES = new Set(['clean', 'validate', 'compile', 'test', 'package', 'verify', 'install', 'deploy', 'site', 'test-compile', 'integration-test', 'spotless:apply', 'spotless:check', 'dependency:tree']);

function pkgIn(ctx: CheckContext, dir: string): NodePackage | 'broken' | null {
  const file = join(dir, 'package.json');
  if (ctx.repo.brokenManifest(file)) return 'broken';
  return ctx.repo.packages.find((p) => p.dir === dir) ?? null;
}

/** `yarn dev`, `npm run build`, `pnpm --filter web test`: a package.json script in the folder the command runs in. */
function checkScript(ctx: CheckContext, span: Span, script: string, dirs: string[], workspace?: string): SpanResult {
  if (workspace) {
    const pkg = ctx.repo.packages.find((p) => p.name === workspace || p.dir === workspace || p.dir.endsWith(`/${workspace}`));
    if (!pkg) return stale(span, `no workspace package named ${workspace}`);
    return script in pkg.scripts ? verified(span, 'definition', [{ ref: `${pkg.file} scripts.${script}`, excerpt: pkg.scripts[script], level: 'definition' }], `script "${script}" in ${pkg.file}`) : stale(span, `${pkg.file} defines no "${script}" script`);
  }
  for (const dir of dirs) {
    const pkg = pkgIn(ctx, dir);
    if (pkg === 'broken') return blocked(span, `${join(dir, 'package.json')} does not parse: ${ctx.repo.brokenManifest(join(dir, 'package.json'))}`);
    if (!pkg) continue;
    if (script in pkg.scripts) return verified(span, 'definition', [{ ref: `${pkg.file} scripts.${script}`, excerpt: pkg.scripts[script], level: 'definition' }], `script "${script}" in ${pkg.file}`);
    const elsewhere = ctx.repo.packages.filter((p) => script in p.scripts && p !== pkg);
    if (elsewhere.length) return unconfirmed(span, `${pkg.file} has no "${script}" script; ${elsewhere.map((p) => p.file).join(', ')} define${elsewhere.length === 1 ? 's' : ''} one`, elsewhere.slice(0, 3).map((p) => ({ ref: `${p.file} scripts.${script}`, level: 'definition' })));
    return stale(span, `no package.json defines a "${script}" script (${pkg.file} has ${Object.keys(pkg.scripts).slice(0, 8).join(', ') || 'none'})`);
  }
  const anywhereDefined = ctx.repo.packages.filter((p) => script in p.scripts);
  if (anywhereDefined.length) return unconfirmed(span, `no package.json where this runs; ${anywhereDefined.map((p) => p.file).join(', ')} define "${script}"`, anywhereDefined.slice(0, 3).map((p) => ({ ref: `${p.file} scripts.${script}`, level: 'definition' })));
  return stale(span, `no package.json defines a "${script}" script`);
}

function packageManager(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const [bin, ...rest] = argv;
  const args = rest.filter((a) => !/^--?(silent|s|quiet|q|frozen-lockfile|immutable|offline|prefer-offline|verbose|loglevel=.*|if-present)$/.test(a));
  let workspace: string | undefined;
  const take = (flag: RegExp): string | undefined => {
    const i = args.findIndex((a) => flag.test(a));
    if (i < 0) return undefined;
    const inline = args[i]?.split('=')[1];
    const value = inline ?? args[i + 1];
    args.splice(i, inline ? 1 : 2);
    return value;
  };
  workspace = take(/^(--workspace|-w|--filter|-F)(=|$)/) ?? workspace;
  if (bin === 'yarn' && args[0] === 'workspace') {
    workspace = args[1];
    args.splice(0, 2);
  }
  const first = args[0];
  if (!first) return notChecked(span, `plain \`${bin}\` installs dependencies`);
  if (bin === 'npm') {
    if (first === 'test' || first === 't' || first === 'start' || first === 'stop' || first === 'restart') return checkScript(ctx, span, first === 't' ? 'test' : first, dirs, workspace);
    if (first === 'run' || first === 'run-script' || first === 'rum') return args[1] ? checkScript(ctx, span, args[1], dirs, workspace) : notChecked(span, '`npm run` lists scripts');
    return notChecked(span, `\`npm ${first}\` is a built-in command`);
  }
  if (first === 'run') return args[1] ? checkScript(ctx, span, args[1], dirs, workspace) : notChecked(span, `\`${bin} run\` lists scripts`);
  const builtins = bin === 'yarn' ? YARN_BUILTINS : bin === 'pnpm' ? PNPM_BUILTINS : BUN_BUILTINS;
  if (builtins.has(first)) return notChecked(span, `\`${bin} ${first}\` is a built-in command`);
  if (bin === 'bun' && /\.(ts|tsx|js|mjs|cjs)$/.test(first)) return fileArg(ctx, span, first, dirs);
  if (bin === 'bun' && first === 'test') return notChecked(span, '`bun test` is the built-in test runner');
  if (first === 'test' && bin !== 'yarn') return checkScript(ctx, span, 'test', dirs, workspace);
  return checkScript(ctx, span, first, dirs, workspace);
}

/** A file the command runs, read from the folders the command may run in. */
function fileArg(ctx: CheckContext, span: Span, file: string, dirs: string[]): SpanResult {
  if (file.startsWith('/') || file.startsWith('~') || file.includes('$')) return notChecked(span, `runs ${file}, outside the repository`);
  for (const dir of dirs) {
    const rel = join(dir, file);
    if (ctx.repo.exists(rel)) return verified(span, 'definition', [{ ref: rel, level: 'definition' }], `${rel} exists`);
  }
  const ignoredBy = ctx.repo.ignored(join(dirs[0], file));
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: built output, not committed`);
  return stale(span, `${join(dirs[0], file)} does not exist`);
}

async function shellScript(ctx: CheckContext, span: Span, file: string, sub: string | undefined, dirs: string[]): Promise<SpanResult> {
  const ignoredBy = ctx.repo.ignored(join(dirs[0], file.replace(/^\.\//, '')));
  if (ignoredBy && !dirs.some((d) => ctx.repo.exists(join(d, file)))) return notChecked(span, `git ignores ${ignoredBy}: built output, not committed`);
  const rel = dirs.map((d) => join(d, file)).find((r) => ctx.repo.exists(r));
  if (!rel) return stale(span, `${join(dirs[0], file)} does not exist`);
  if (!sub || sub.startsWith('-') || sub.includes('$') || /^["']/.test(sub)) return verified(span, 'definition', [{ ref: rel, level: 'definition' }], `${rel} exists`);
  const text = ctx.repo.read(rel) ?? '';
  const isShell = /\.(sh|bash|zsh)$/.test(rel) || /^#!.*\b(ba|z)?sh\b/.test(text) || !/^#!/.test(text);
  if (!isShell) return unconfirmed(span, `${rel} exists but is not a shell script; its subcommands are not read`, [{ ref: rel, level: 'definition' }]);
  const entries = await shellEntries(ctx.syntax, ctx.repo, rel);
  const hit = entries?.get(sub);
  if (hit) return verified(span, 'definition', [{ ref: `${rel}:${hit.line}`, excerpt: text.split('\n')[hit.line - 1]?.trim(), level: 'definition' }], `${hit.kind === 'case' ? 'case label' : 'function'} ${sub} at ${rel}:${hit.line}`);
  const known = [...(entries?.keys() ?? [])];
  return stale(span, `${rel} defines no "${sub}" function or case label${known.length ? ` (it has ${known.slice(0, 10).join(', ')})` : ''}`);
}

function makefileTargets(text: string): Map<string, number> {
  const out = new Map<string, number>();
  text.split('\n').forEach((l, i) => {
    const m = l.match(/^([^\s:=#][^:=]*?)\s*::?(?!=)/);
    if (!m?.[1] || l.startsWith('\t')) return;
    for (const t of m[1].split(/\s+/)) if (t && !t.startsWith('.') && !out.has(t)) out.set(t, i + 1);
  });
  return out;
}

function make(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const args = argv.slice(1);
  let dirsHere = dirs;
  let file: string | undefined;
  const targets: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i] ?? '';
    if (a === '-C' || a === '--directory') dirsHere = dirs.map((d) => join(d, args[++i] ?? ''));
    else if (a.startsWith('-C')) dirsHere = dirs.map((d) => join(d, a.slice(2)));
    else if (a === '-f' || a === '--file') file = args[++i];
    else if (a.startsWith('-') || a.includes('=')) continue;
    else targets.push(a);
  }
  const names = file ? [file] : ['GNUmakefile', 'makefile', 'Makefile'];
  const here = dirsHere.flatMap((d) => names.map((n) => join(d, n))).find((f) => ctx.repo.exists(f));
  const all = ctx.repo.find(/(^|\/)(GNUmakefile|makefile|Makefile)$/);
  if (!here) {
    if (!all.length) return stale(span, `no Makefile${dirsHere[0] ? ` in ${dirsHere[0]}/` : ''} or anywhere in the repository`);
    const defining = all.filter((f) => targets.every((t) => makefileTargets(ctx.repo.read(f) ?? '').has(t)));
    if (defining.length) return unconfirmed(span, `no Makefile where this runs; ${defining.join(', ')} define${defining.length === 1 ? 's' : ''} ${targets.join(' ') || 'a default target'}: run it from that folder or say where`, defining.slice(0, 3).map((f) => ({ ref: f, level: 'definition' })));
    return stale(span, `no Makefile where this runs, and none defines ${targets.join(' ')}`);
  }
  const text = ctx.repo.read(here) ?? '';
  const map = makefileTargets(text);
  if (!targets.length) return verified(span, 'definition', [{ ref: here, level: 'definition' }], `${here} has a default target`);
  const missing = targets.filter((t) => !map.has(t) && !/^%/.test(t));
  const pattern = [...map.keys()].some((k) => k.includes('%'));
  if (missing.length && !pattern) return stale(span, `${here} defines no ${missing.join(', ')} target`);
  if (missing.length) return unconfirmed(span, `${here} has pattern rules that may build ${missing.join(', ')}`, [{ ref: here, level: 'reference' }], 'reference');
  const first = targets[0] ?? '';
  return verified(span, 'definition', [{ ref: `${here}:${map.get(first)}`, excerpt: text.split('\n')[(map.get(first) ?? 1) - 1]?.trim(), level: 'definition' }], `target ${targets.join(', ')} in ${here}`);
}

function just(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const recipe = argv.slice(1).find((a) => !a.startsWith('-'));
  const file = dirs.flatMap((d) => ['justfile', 'Justfile', '.justfile'].map((n) => join(d, n))).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, 'no justfile where this runs');
  if (!recipe) return verified(span, 'definition', [{ ref: file, level: 'definition' }], `${file} exists`);
  const lines = (ctx.repo.read(file) ?? '').split('\n');
  const at = lines.findIndex((l) => new RegExp(`^@?${recipe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s[^:=]*)?:(?!=)`).test(l));
  return at >= 0 ? verified(span, 'definition', [{ ref: `${file}:${at + 1}`, excerpt: lines[at]?.trim(), level: 'definition' }], `recipe ${recipe} in ${file}`) : stale(span, `${file} defines no "${recipe}" recipe`);
}

function task(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const name = argv.slice(1).find((a) => !a.startsWith('-'));
  const file = dirs.flatMap((d) => ['Taskfile.yml', 'Taskfile.yaml', 'taskfile.yml', 'taskfile.yaml'].map((n) => join(d, n))).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, 'no Taskfile where this runs');
  const data = ctx.repo.structured(file) as { tasks?: Record<string, unknown> } | null;
  if (!data) return blocked(span, `${file} does not parse`);
  if (!name) return verified(span, 'definition', [{ ref: file, level: 'definition' }], `${file} exists`);
  return data.tasks && name in data.tasks ? verified(span, 'definition', [{ ref: `${file} tasks.${name}`, level: 'definition' }], `task ${name} in ${file}`) : stale(span, `${file} defines no "${name}" task`);
}

function pythonModule(ctx: CheckContext, mod: string, dirs: string[]): string | null {
  const p = mod.replace(/\./g, '/');
  for (const d of [...dirs, 'src', ...ctx.repo.projectDirs]) {
    for (const c of [`${p}.py`, `${p}/__init__.py`, `${p}/__main__.py`]) if (ctx.repo.exists(join(d, c))) return join(d, c);
  }
  return null;
}

function python(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const args = argv.slice(1);
  const m = args.indexOf('-m');
  if (m >= 0) {
    const mod = args[m + 1];
    if (!mod) return notChecked(span, 'no module given');
    const found = pythonModule(ctx, mod, dirs);
    return found ? verified(span, 'definition', [{ ref: found, level: 'definition' }], `module ${mod} at ${found}`) : notChecked(span, `module ${mod} comes from the environment, not this repository`);
  }
  const file = args.find((a) => !a.startsWith('-'));
  if (!file || args.includes('-c')) return notChecked(span, 'runs inline code');
  return fileArg(ctx, span, file, dirs);
}

function pyprojectScripts(ctx: CheckContext, dirs: string[]): { file: string; scripts: Set<string> } | null {
  for (const d of dirs) {
    const file = join(d, 'pyproject.toml');
    const data = ctx.repo.structured(file) as Record<string, any> | null;
    if (!data) continue;
    const names = new Set<string>([
      ...Object.keys(data.project?.scripts ?? {}),
      ...Object.keys(data.tool?.poetry?.scripts ?? {}),
      ...Object.keys(data.tool?.pdm?.scripts ?? {}),
      ...Object.values<any>(data.tool?.hatch?.envs ?? {}).flatMap((e) => Object.keys(e?.scripts ?? {})),
      ...Object.keys(data.tool?.taskipy?.tasks ?? {}),
      ...Object.keys(data.tool?.poe?.tasks ?? {}),
    ]);
    return { file, scripts: names };
  }
  return null;
}

function pythonRunner(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const [bin, sub, ...rest] = argv;
  if (sub !== 'run') return notChecked(span, `\`${bin} ${sub ?? ''}\` is a built-in command`);
  const target = rest.find((a) => !a.startsWith('-'));
  if (!target) return notChecked(span, 'no command given');
  if (/\.py$/.test(target) || target.includes('/')) return fileArg(ctx, span, target, dirs);
  if (target === 'python' || target === 'python3') return python(ctx, span, ['python', ...rest.slice(rest.indexOf(target) + 1)], dirs);
  const py = pyprojectScripts(ctx, dirs);
  if (py?.scripts.has(target)) return verified(span, 'definition', [{ ref: `${py.file} ${target}`, level: 'definition' }], `script ${target} in ${py.file}`);
  return notChecked(span, `runs ${target} from the environment${py ? ` (not a script in ${py.file})` : ''}`);
}

function tox(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const file = dirs.map((d) => join(d, 'tox.ini')).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, 'no tox.ini where this runs');
  const e = argv.indexOf('-e');
  const env = e >= 0 ? argv[e + 1] : undefined;
  if (!env) return verified(span, 'definition', [{ ref: file, level: 'definition' }], `${file} exists`);
  const text = ctx.repo.read(file) ?? '';
  const ok = env.split(',').every((x) => new RegExp(`\\[testenv:${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]|envlist\\s*=.*\\b${x}\\b`, 's').test(text));
  return ok ? verified(span, 'definition', [{ ref: file, level: 'definition' }], `env ${env} in ${file}`) : stale(span, `${file} defines no ${env} env`);
}

function nox(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const file = dirs.map((d) => join(d, 'noxfile.py')).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, 'no noxfile.py where this runs');
  const s = argv.findIndex((a) => a === '-s' || a === '--session');
  const session = s >= 0 ? argv[s + 1] : undefined;
  if (!session) return verified(span, 'definition', [{ ref: file, level: 'definition' }], `${file} exists`);
  const lines = (ctx.repo.read(file) ?? '').split('\n');
  const at = lines.findIndex((l) => new RegExp(`^def ${session}\\b`).test(l));
  return at >= 0 ? verified(span, 'definition', [{ ref: `${file}:${at + 1}`, level: 'definition' }], `session ${session} in ${file}`) : stale(span, `${file} defines no "${session}" session`);
}

const GO_VALUE_FLAGS = new Set(['-o', '-C', '-p', '-ldflags', '-gcflags', '-asmflags', '-tags', '-mod', '-modfile', '-pkgdir', '-toolexec', '-overlay', '-pgo', '-run', '-skip', '-bench', '-benchtime', '-count', '-cpu', '-timeout', '-parallel', '-coverprofile', '-covermode', '-coverpkg', '-cpuprofile', '-memprofile', '-blockprofile', '-mutexprofile', '-trace', '-outputdir', '-exec', '-json', '-vet', '-shuffle', '-fuzz', '-fuzztime']);

function goCmd(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const mod = [...dirs, ...ctx.repo.projectDirs].map((d) => join(d, 'go.mod')).find((f) => ctx.repo.exists(f));
  if (!mod) return stale(span, 'no go.mod in this repository');
  const sub = argv[1];
  // Flags that take a value (`-o ./bin/x`, `-run TestX`) are skipped with it; what is left are packages.
  const pkgs = argv.slice(2).filter((a, i, all) => /^\.{1,2}(\/|$)/.test(a) && !GO_VALUE_FLAGS.has(all[i - 1] ?? ''));
  for (const p of pkgs) {
    const clean = p.replace(/\/\.\.\.$/, '').replace(/^\.\/?/, '');
    if (clean === '' || clean === '...') continue;
    if (!dirs.some((d) => ctx.repo.exists(join(d, clean)))) return stale(span, `go package ${p} does not exist`);
  }
  return verified(span, pkgs.length ? 'definition' : 'reference', [{ ref: mod, level: 'reference' }], `go ${sub ?? ''}${pkgs.length ? ` on ${pkgs.join(' ')}` : ''} in a Go module (${mod})`);
}

function cargo(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const manifest = [...dirs, ...ctx.repo.projectDirs].map((d) => join(d, 'Cargo.toml')).find((f) => ctx.repo.exists(f));
  if (!manifest) return stale(span, 'no Cargo.toml in this repository');
  const sub = argv[1] ?? '';
  const aliases = ['.cargo/config.toml', '.cargo/config'].map((f) => ctx.repo.structured(f) as { alias?: Record<string, unknown> } | null).flatMap((c) => Object.keys(c?.alias ?? {}));
  if (!CARGO_BUILTINS.has(sub) && !aliases.includes(sub)) return unconfirmed(span, `\`cargo ${sub}\` is neither a built-in command nor an alias in .cargo/config.toml; it may be a plugin`, [{ ref: manifest, level: 'reference' }]);
  const p = argv.findIndex((a) => a === '-p' || a === '--package');
  if (p >= 0) {
    const crate = argv[p + 1];
    const names = ctx.repo.find(/(^|\/)Cargo\.toml$/).map((f) => (ctx.repo.structured(f) as { package?: { name?: string } } | null)?.package?.name).filter(Boolean);
    if (crate && !names.includes(crate)) return stale(span, `no crate named ${crate} in the workspace (${names.slice(0, 8).join(', ')})`);
  }
  return verified(span, aliases.includes(sub) ? 'definition' : 'reference', [{ ref: manifest, level: 'reference' }], `cargo ${sub} in a Cargo project (${manifest})`);
}

function compose(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const args = argv[0] === 'docker' ? argv.slice(2) : argv.slice(1);
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) if (args[i] === '-f' || args[i] === '--file') files.push(args[++i] ?? '');
  const candidates = files.length ? files : ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];
  const found = dirs.flatMap((d) => candidates.map((n) => join(d, n))).filter((f) => ctx.repo.exists(f));
  if (files.length && found.length < files.length) return stale(span, `compose file ${files.find((f) => !dirs.some((d) => ctx.repo.exists(join(d, f))))} does not exist`);
  if (!found.length) return stale(span, 'no compose file where this runs');
  const rest = args.filter((a, i) => !a.startsWith('-') && args[i - 1] !== '-f' && args[i - 1] !== '--file' && args[i - 1] !== '-p' && args[i - 1] !== '--profile');
  const sub = rest[0];
  const services = new Set(found.flatMap((f) => Object.keys((ctx.repo.structured(f) as { services?: Record<string, unknown> } | null)?.services ?? {})));
  const named = ['up', 'run', 'exec', 'logs', 'restart', 'build', 'stop', 'start', 'rm', 'pull', 'create', 'kill'].includes(sub ?? '') ? rest.slice(1).filter((s) => !s.includes('=')) : [];
  const target = sub === 'run' || sub === 'exec' ? named.slice(0, 1) : named;
  const missing = target.filter((s) => !services.has(s));
  if (missing.length) return stale(span, `${found.join(', ')} defines no ${missing.join(', ')} service (it has ${[...services].slice(0, 10).join(', ')})`);
  return verified(span, target.length ? 'definition' : 'reference', found.map((f) => ({ ref: f, level: target.length ? 'definition' : 'reference' })), target.length ? `service ${target.join(', ')} in ${found.join(', ')}` : `${found.join(', ')} exists`);
}

async function rake(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): Promise<SpanResult> {
  const name = argv.slice(argv[0] === 'bundle' ? 3 : 1).find((a) => !a.startsWith('-'))?.split('[')[0];
  const files = [...new Set([...dirs.map((d) => join(d, 'Rakefile')), ...ctx.repo.find(/(^|\/)(Rakefile|[^/]+\.rake)$/)])].filter((f) => ctx.repo.exists(f));
  if (!files.length) return stale(span, 'no Rakefile where this runs');
  if (!name) return verified(span, 'definition', [{ ref: files[0] ?? '', level: 'definition' }], 'Rakefile exists');
  for (const f of files) {
    const tasks = await rakeTasks(ctx.syntax, ctx.repo, f);
    // `rake changelog:*`: any task of that namespace.
    const line = name.endsWith(':*') ? [...tasks.entries()].find(([t]) => t.startsWith(name.slice(0, -1)))?.[1] : tasks.get(name);
    if (line) return verified(span, 'definition', [{ ref: `${f}:${line}`, excerpt: ctx.repo.lines(f)[line - 1]?.trim(), level: 'definition' }], `task ${name} at ${f}:${line}`);
  }
  return unconfirmed(span, `no "${name}" task found in ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` and ${files.length - 3} more` : ''}; it may come from a gem`);
}

function composer(ctx: CheckContext, span: Span, argv: string[], dirs: string[]): SpanResult {
  const sub = argv[1] === 'run' || argv[1] === 'run-script' ? argv[2] : argv[1];
  const file = dirs.map((d) => join(d, 'composer.json')).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, 'no composer.json where this runs');
  const data = ctx.repo.structured(file) as { scripts?: Record<string, unknown> } | null;
  if (!data) return blocked(span, `${file} does not parse`);
  if (!sub || ['install', 'update', 'require', 'remove', 'dump-autoload', 'dumpautoload', 'show', 'outdated', 'validate', 'init', 'create-project'].includes(sub)) return notChecked(span, `\`composer ${sub ?? ''}\` is a built-in command`);
  return data.scripts && sub in data.scripts ? verified(span, 'definition', [{ ref: `${file} scripts.${sub}`, level: 'definition' }], `script ${sub} in ${file}`) : stale(span, `${file} defines no "${sub}" script`);
}

/** A local executable the repository ships (bin/x, a package.json bin). */
function localBin(ctx: CheckContext, name: string): string | null {
  for (const p of ctx.repo.packages) if (p.name === name) return p.file;
  return ctx.repo.files.find((f) => /^(bin|scripts|tools)\/[^/]+$/.test(f) && posix.basename(f).replace(/\.\w+$/, '') === name) ?? null;
}

const binCache = new WeakMap<object, Map<string, string>>();

/** Programs this repository builds, by name: Go `cmd/<name>`, package.json `bin`, pyproject scripts, Cargo binaries. */
function projectBinaries(ctx: CheckContext): Map<string, string> {
  const cached = binCache.get(ctx.repo);
  if (cached) return cached;
  const out = new Map<string, string>();
  for (const d of ctx.repo.dirs) {
    const m = d.match(/(?:^|\/)cmd\/([\w.-]+)$/);
    if (m?.[1] && ctx.repo.files.some((f) => f.startsWith(`${d}/`) && f.endsWith('.go'))) out.set(m[1], d);
  }
  for (const p of ctx.repo.packages) {
    const json = ctx.repo.structured(p.file, { quiet: true }) as { bin?: unknown; name?: unknown } | null;
    if (typeof json?.bin === 'string' && typeof json.name === 'string') out.set(json.name.replace(/^@[^/]+\//, ''), p.file);
    else if (json?.bin && typeof json.bin === 'object') for (const k of Object.keys(json.bin)) out.set(k, p.file);
  }
  for (const f of ctx.repo.find(/(^|\/)pyproject\.toml$/)) {
    const py = ctx.repo.structured(f, { quiet: true }) as { project?: { scripts?: Record<string, unknown> }; tool?: { poetry?: { scripts?: Record<string, unknown> } } } | null;
    for (const k of Object.keys({ ...py?.project?.scripts, ...py?.tool?.poetry?.scripts })) out.set(k, f);
  }
  for (const f of ctx.repo.find(/(^|\/)Cargo\.toml$/)) {
    const cargo = ctx.repo.structured(f, { quiet: true }) as { package?: { name?: string }; bin?: { name?: string }[] } | null;
    for (const b of cargo?.bin ?? []) if (b.name) out.set(b.name, f);
    const dir = posix.dirname(f) === '.' ? '' : posix.dirname(f);
    if (cargo?.package?.name && ctx.repo.exists(join(dir, 'src/main.rs'))) out.set(cargo.package.name, f);
  }
  binCache.set(ctx.repo, out);
  return out;
}

/** Where a program of this repository is built from, or null when `name` is not one. */
export function projectBinary(ctx: CheckContext, name: string): string | null {
  return name ? (projectBinaries(ctx).get(name) ?? null) : null;
}

/**
 * `no-mistakes axi answer --run x`: each subcommand and long flag must appear in code as an exact string
 * (how command-line libraries register them). A missing one is unconfirmed: dispatch can be dynamic.
 */
function projectCommand(ctx: CheckContext, span: Span, argv: string[], source: string): SpanResult {
  const tokens = argv.slice(1).filter((a) => !/^<.*>$/.test(a));
  const subcommands = tokens.slice(0, tokens.findIndex((a) => a.startsWith('-')) >>> 0).filter((a) => /^[a-z][\w-]*$/.test(a)).slice(0, 3);
  const flags = tokens.filter((a) => /^--[a-z][\w-]*$/.test(a)).map((a) => a.replace(/=.*$/, ''));
  const evidence: Evidence[] = [{ ref: source, level: 'definition' }];
  // Command-line code lives next to the program or in a cli/cmd/commands folder.
  const home = /\.(json|toml)$/.test(source) ? posix.dirname(source) : source;
  const cliDirs = [...new Set([home === '.' ? '' : home, ...[...ctx.repo.dirs].filter((d) => /(^|\/)(cli|cmd|cmds|commands?)$/.test(d))])].filter(Boolean);
  const pathspec = cliDirs.length ? cliDirs : ['.'];
  for (const word of [...subcommands, ...flags]) {
    const found = stringInCode(ctx, word, pathspec) ?? (word.startsWith('--') ? stringInCode(ctx, word.slice(2), pathspec) : null);
    if (!found) return unconfirmed(span, `${argv[0]} is built from ${source}, but "${word.replace(/^--/, '')}" appears in no string in its code`, evidence, 'reference');
    evidence.push(found);
  }
  const parts = [...subcommands, ...flags];
  return verified(span, 'reference', evidence.slice(0, 3), `${argv[0]} is built from ${source}${parts.length ? `; ${parts.join(', ')} ${parts.length === 1 ? 'is a string' : 'are strings'} in its code (${evidence[1]?.ref ?? ''})` : ''}`);
}

/** Binaries whose package has another name: `npx tsc` runs typescript. */
const BIN_PACKAGES: Record<string, string> = { tsc: 'typescript', tsserver: 'typescript', 'ts-node': 'ts-node', next: 'next', nuxt: 'nuxt', vite: 'vite', ng: '@angular/cli', nx: 'nx', turbo: 'turbo', jest: 'jest', vitest: 'vitest', playwright: '@playwright/test', cypress: 'cypress', eslint: 'eslint', prettier: 'prettier', biome: '@biomejs/biome', tsup: 'tsup', rollup: 'rollup', webpack: 'webpack-cli', 'drizzle-kit': 'drizzle-kit', prisma: 'prisma', knex: 'knex', 'sequelize-cli': 'sequelize-cli', changeset: '@changesets/cli', lerna: 'lerna', 'npm-run-all': 'npm-run-all', concurrently: 'concurrently', husky: 'husky', 'lint-staged': 'lint-staged', tailwindcss: 'tailwindcss', storybook: 'storybook', wrangler: 'wrangler', vercel: 'vercel', 'react-scripts': 'react-scripts', mocha: 'mocha', c8: 'c8', nyc: 'nyc', rimraf: 'rimraf', esbuild: 'esbuild', swc: '@swc/cli', 'openapi-typescript': 'openapi-typescript', typedoc: 'typedoc', 'api-extractor': '@microsoft/api-extractor' };

/** The installed package whose package.json `bin` provides `tool`, when node_modules is present. */
function binOwner(ctx: CheckContext, tool: string): string | null {
  for (const p of ctx.repo.packages) {
    for (const dep of Object.keys(p.deps)) {
      const manifest = ctx.repo.structured(join(p.dir, 'node_modules', dep, 'package.json'), { quiet: true }) as { bin?: unknown } | null;
      const bin = manifest?.bin;
      if ((typeof bin === 'string' && dep.replace(/^@[^/]+\//, '') === tool) || (bin && typeof bin === 'object' && tool in bin)) return dep;
    }
  }
  return null;
}

/** Tasks every Gradle build has, or that the common plugins (java, application, spring boot) add. */
const GRADLE_BUILTINS = new Set(['build', 'clean', 'test', 'check', 'assemble', 'jar', 'javadoc', 'classes', 'compileJava', 'compileKotlin', 'compileTestJava', 'processResources', 'dependencies', 'dependencyInsight', 'tasks', 'projects', 'properties', 'help', 'init', 'wrapper', 'publish', 'publishToMavenLocal', 'run', 'installDist', 'distZip', 'bootRun', 'bootJar', 'bootBuildImage', 'spotlessApply', 'spotlessCheck', 'koverHtmlReport', 'jacocoTestReport', 'lint', 'detekt', 'ktlintCheck', 'ktlintFormat']);

/** `./gradlew integrationTest`: tasks registered in the build files, or built in; a plugin task is unconfirmed. */
function gradleTasks(ctx: CheckContext, span: Span, argv: string[], build: string): SpanResult {
  const names = argv.slice(1).filter((a) => !a.startsWith('-')).map((a) => a.split(':').pop() ?? a).filter(Boolean);
  if (!names.length) return verified(span, 'reference', [{ ref: build, level: 'reference' }], `default tasks of ${build}`);
  const files = ctx.repo.find(/(^|\/)(build|settings)\.gradle(\.kts)?$|\.gradle(\.kts)?$/);
  const evidence = [];
  for (const name of names) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`tasks\\.(?:register|create|named)(?:<[^>]*>)?\\(\\s*["']${n}["']|\\btask\\s*\\(?\\s*["']?${n}\\b`);
    const hit = files.flatMap((f) => ctx.repo.lines(f).map((l, i) => ({ f, i, l }))).find((x) => re.test(x.l));
    if (hit) evidence.push({ ref: `${hit.f}:${hit.i + 1}`, excerpt: hit.l.trim(), level: 'definition' as const });
    else if (GRADLE_BUILTINS.has(name)) evidence.push({ ref: `${name} is a standard Gradle task`, level: 'reference' as const });
    else return unconfirmed(span, `no build file registers a "${name}" task; it may come from a plugin`, [{ ref: build, level: 'reference' }]);
  }
  const level = evidence.every((e) => e.level === 'definition') ? 'definition' : 'reference';
  return verified(span, level, evidence.slice(0, 3), `${names.join(', ')}: ${evidence.map((e) => e.ref).join('; ')}`);
}

/** One simple shell command, dispatched to the checker of the tool it runs. */
export async function checkCommand(ctx: CheckContext, span: Span): Promise<SpanResult> {
  const sc = splitShell(span.text)[0];
  if (!sc?.argv.length) return notChecked(span, 'empty command');
  const argv = sc.argv;
  if (/<[^>]+>/.test(span.text) && !projectBinary(ctx, argv[0] ?? '')) return notChecked(span, 'a template with placeholders, not a command to run');
  const dirs = workingDirs(ctx, span);
  const bin = argv[0] ?? '';
  switch (bin) {
    case 'yarn':
    case 'npm':
    case 'pnpm':
    case 'bun':
      return packageManager(ctx, span, argv, dirs);
    case 'npx':
    case 'bunx':
    case 'pnpx': {
      const tool = argv.slice(1).find((a) => !a.startsWith('-'))?.replace(/@[\d^~][\w.-]*$/, '');
      if (!tool) return notChecked(span, 'no tool given');
      const pkgName = BIN_PACKAGES[tool] ?? binOwner(ctx, tool) ?? tool;
      const owner = ctx.repo.packages.find((p) => pkgName in p.deps || tool in p.deps || Object.keys(p.deps).some((d) => d.endsWith(`/${tool}`)));
      return owner ? verified(span, 'reference', [{ ref: `${owner.file} depends on ${pkgName}`, level: 'reference' }], `${tool} comes from ${pkgName}, a dependency in ${owner.file}`) : notChecked(span, `downloads ${tool} from the registry when run`);
    }
    case 'node':
    case 'deno':
    case 'tsx':
    case 'ts-node': {
      const file = argv.slice(1).find((a) => !a.startsWith('-') && a !== 'run');
      if (!file || argv.includes('-e') || argv.includes('--eval')) return notChecked(span, 'runs inline code');
      return fileArg(ctx, span, file, dirs);
    }
    case 'bash':
    case 'sh':
    case 'zsh':
    case 'source':
    case '.': {
      const file = argv.slice(1).find((a) => !a.startsWith('-'));
      if (!file || argv.includes('-c')) return notChecked(span, 'runs inline code');
      return shellScript(ctx, span, file, argv[argv.indexOf(file) + 1], dirs);
    }
    case 'make':
    case 'gmake':
      return make(ctx, span, argv, dirs);
    case 'just':
      return just(ctx, span, argv, dirs);
    case 'task':
      return task(ctx, span, argv, dirs);
    case 'python':
    case 'python3':
      return python(ctx, span, argv, dirs);
    case 'uv':
    case 'poetry':
    case 'pdm':
    case 'hatch':
      return pythonRunner(ctx, span, argv, dirs);
    case 'tox':
      return tox(ctx, span, argv, dirs);
    case 'nox':
      return nox(ctx, span, argv, dirs);
    case 'go':
      return goCmd(ctx, span, argv, dirs);
    case 'cargo':
      return cargo(ctx, span, argv, dirs);
    case 'docker-compose':
      return compose(ctx, span, argv, dirs);
    case 'docker':
      if (argv[1] === 'compose') return compose(ctx, span, argv, dirs);
      return notChecked(span, `external tool \`docker ${argv[1] ?? ''}\``);
    case 'rake':
      return rake(ctx, span, argv, dirs);
    case 'bundle':
      return argv[1] === 'exec' && argv[2] === 'rake' ? rake(ctx, span, argv, dirs) : notChecked(span, `\`bundle ${argv[1] ?? ''}\` is a built-in command`);
    case 'composer':
      return composer(ctx, span, argv, dirs);
    case 'mvn':
    case './mvnw': {
      const pom = dirs.map((d) => join(d, 'pom.xml')).find((f) => ctx.repo.exists(f));
      if (!pom) return stale(span, 'no pom.xml where this runs');
      const goals = argv.slice(1).filter((a) => !a.startsWith('-'));
      const unknown = goals.filter((g) => !MAVEN_PHASES.has(g));
      return unknown.length ? unconfirmed(span, `${unknown.join(', ')} is not a standard Maven phase; plugin goals are not read`, [{ ref: pom, level: 'reference' }]) : verified(span, 'reference', [{ ref: pom, level: 'reference' }], `standard Maven phases on ${pom}`);
    }
    case './gradlew':
    case 'gradle':
    case 'gradlew': {
      const build = dirs.flatMap((d) => ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'].map((n) => join(d, n))).find((f) => ctx.repo.exists(f));
      if (bin === './gradlew' && !dirs.some((d) => ctx.repo.exists(join(d, 'gradlew')))) return stale(span, 'no gradlew wrapper where this runs');
      if (!build) return stale(span, 'no Gradle build file where this runs');
      return gradleTasks(ctx, span, argv, build);
    }
    case 'dotnet': {
      const proj = ctx.repo.find(/\.(sln|csproj|fsproj)$/);
      return proj.length ? verified(span, 'reference', [{ ref: proj[0] ?? '', level: 'reference' }], `.NET project ${proj[0]}`) : stale(span, 'no .sln or .csproj in this repository');
    }
    case 'pytest': {
      const declared = ctx.repo.find(/(^|\/)(pyproject\.toml|requirements[\w.-]*\.txt|setup\.cfg|tox\.ini|pytest\.ini)$/).find((f) => /pytest/.test(ctx.repo.read(f) ?? ''));
      return declared ? verified(span, 'reference', [{ ref: declared, level: 'reference' }], `pytest is configured in ${declared}`) : notChecked(span, 'pytest comes from the environment');
    }
    default:
      break;
  }
  if (/^\/[a-z][\w-]*$/.test(bin)) {
    // A single-segment `/name` is a command typed for a bot or agent, not an absolute path to a program.
    const handler = stringInCode(ctx, bin.slice(1), ['.github']) ?? stringInCode(ctx, bin, ['.github']);
    return handler ? verified(span, 'reference', [handler], `a bot command handled at ${handler.ref}`) : notChecked(span, `a command for a bot (${bin}), not a program in this repository`);
  }
  if (/^\.{0,2}\//.test(bin) || /^[\w.-]+\/[\w./-]+$/.test(bin)) {
    const file = bin.replace(/^\.\//, '');
    if (/^\.\/(gradlew|mvnw)$/.test(bin)) return fileArg(ctx, span, file, dirs);
    return shellScript(ctx, span, file, argv[1], dirs);
  }
  const program = projectBinary(ctx, bin);
  if (program) return projectCommand(ctx, span, argv, program);
  if (KNOWN_TOOLS.has(bin)) return notChecked(span, `external tool \`${bin}\``);
  const local = localBin(ctx, bin);
  if (local) return verified(span, 'reference', [{ ref: local, level: 'reference' }], `${bin} is provided by ${local}`);
  return notChecked(span, `\`${bin}\` is not a command this repository defines`);
}
