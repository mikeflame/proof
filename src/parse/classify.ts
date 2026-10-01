import type { Span } from '../model.ts';
import { DEPENDENCY_ALIASES } from './aliases.ts';
import { splitShell } from './shell.ts';

/** Commands whose first word is enough to read inline code as a shell command. */
export const KNOWN_TOOLS = new Set([
  'yarn', 'npm', 'npx', 'pnpm', 'bun', 'bunx', 'deno', 'node', 'tsx', 'ts-node', 'corepack',
  'bash', 'sh', 'zsh', 'fish', 'source', 'make', 'gmake', 'just', 'task', 'mise', 'asdf',
  'python', 'python3', 'pip', 'pip3', 'pipx', 'uv', 'uvx', 'poetry', 'pdm', 'hatch', 'conda', 'pytest', 'tox', 'nox', 'pre-commit',
  'go', 'gofmt', 'cargo', 'rustup', 'rustc', 'java', 'mvn', 'gradle', 'kotlin', 'dotnet', 'ruby', 'bundle', 'rake', 'rails', 'gem', 'php', 'composer',
  'docker', 'docker-compose', 'podman', 'kubectl', 'helm', 'terraform', 'terragrunt', 'tofu', 'pulumi', 'aws', 'gcloud', 'az', 'sops', 'eksctl',
  'git', 'gh', 'glab', 'curl', 'wget', 'brew', 'apt', 'apt-get', 'dnf', 'yum', 'pacman', 'snap',
  'echo', 'cat', 'ls', 'grep', 'rg', 'find', 'sed', 'awk', 'chmod', 'mkdir', 'rm', 'cp', 'mv', 'cd', 'tee', 'touch', 'ln', 'xargs',
  'jq', 'yq', 'psql', 'mysql', 'redis-cli', 'mongosh', 'sqlite3', 'openssl', 'ssh', 'scp', 'rsync', 'tar', 'unzip',
  'eslint', 'prettier', 'tsc', 'vitest', 'jest', 'cypress', 'playwright', 'biome', 'ruff', 'black', 'mypy', 'flake8', 'golangci-lint',
  'claude', 'codex', 'gemini', 'pm2', 'nodemon', 'ngrok', 'vercel', 'netlify', 'wrangler', 'firebase', 'supabase', 'fly', 'heroku',
  'sudo', 'env', 'time', 'export', 'sysctl', 'systemctl', 'journalctl', 'kill', 'lsof', 'ps',
]);

/** Commands that take a file to run; the command check validates that file itself. */
export const FILE_RUNNERS = new Set(['bash', 'sh', 'zsh', 'fish', 'source', 'node', 'deno', 'tsx', 'ts-node', 'python', 'python3', 'ruby', 'php', 'bun']);

const FILE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|json|jsonc|json5|md|mdx|mdc|ya?ml|sh|bash|zsh|toml|ini|cfg|conf|sql|env|example|sample|mjml|css|scss|sass|less|lock|txt|py|pyi|go|mod|sum|rs|rb|php|java|kt|kts|gradle|cs|csproj|sln|fs|swift|c|h|cc|cpp|hpp|html|vue|svelte|astro|xml|proto|graphql|gql|tf|tfvars|hcl|dockerfile|ps1|bat|cmd|wasm|pem|crt|key|csv|tsv|png|svg|jpg|jpeg|gif|webp|ico|pdf|zip|gz|tgz)$/i;
/** `.ts`, `.md`: a file type mentioned in prose, not a file. */
const BARE_EXTENSION = /^\.[a-z0-9]{1,6}$/i;
const IDENT = /^[A-Za-z_$][\w$]*$/;

export function isPathLike(t: string): boolean {
  if (!t || /\s/.test(t) || /^[a-z][\w+.-]*:\/\//i.test(t) || /^[a-z]+:/i.test(t)) return false;
  if (BARE_EXTENSION.test(t) && !/^\.(env|gitignore|nvmrc|npmrc|editorconfig|prettierrc|eslintrc|babelrc|dockerignore|tool-versions|node-version|python-version|ruby-version)$/i.test(t)) return false;
  // `process.env` is a member expression; env files start with a dot or have a folder.
  if (!t.includes('/') && /^[A-Za-z_$][\w$]*\.env$/.test(t)) return false;
  if (t.startsWith('@') && !t.includes('/')) return false;
  if (t.includes('/')) return /^[\w.~@<>[\]{}|*?()+,=-]+(\/[\w.~@<>[\]{}|*?()+,=-]*)*\/?$/.test(t) || t.startsWith('/') || t.startsWith('~/');
  return FILE_EXT.test(t) || /^\.[\w.-]+$/.test(t) || /^(Makefile|Dockerfile|Procfile|Gemfile|Rakefile|Justfile|justfile|Taskfile|Brewfile|Vagrantfile|Jenkinsfile|LICENSE|README|CHANGELOG|CODEOWNERS)(\.[\w.]+)?$/.test(t);
}

/**
 * A qualified name such as `internal/testgit.RealGit` or `testgit.RealGit`: a package path, a dot and
 * an identifier that is not a file extension. Returns the scope (package path) and the name.
 */
export function qualifiedName(t: string): { scope: string; name: string } | null {
  const m = t.match(/^([\w./-]*[\w-])\.([A-Za-z_]\w*)$/);
  if (!m) return null;
  const [, scope = '', name = ''] = m;
  if (FILE_EXT.test(`.${name}`) || /^(json|yaml|yml|lock|config|test|spec|d|min|local|example)$/i.test(name)) return null;
  if (!scope.includes('/') && !IDENT.test(scope.split('.').pop() ?? '')) return null;
  return { scope, name };
}

/** Flags whose value is a file the command writes: the path need not exist before it runs. */
export const OUTPUT_FLAGS = new Set(['-o', '--out', '--output', '--outfile', '--out-file', '--outdir', '--out-dir', '--output-dir', '-coverprofile', '-cpuprofile', '-memprofile', '--coverage-dir', '--junit-xml', '--report']);

/** Repository paths among a command's arguments, resolved later against the command's working folder. */
function pathArgs(argv: string[], cwd: string | undefined, hintDirs: string[]): Span[] {
  const skipFirst = FILE_RUNNERS.has(argv[0] ?? '') || /^\.?\.?\//.test(argv[0] ?? '');
  return argv
    .slice(skipFirst ? 2 : 1)
    .filter((tok, i, all) => !OUTPUT_FLAGS.has(all[i - 1] ?? ''))
    .filter((tok) => !tok.startsWith('-') && !tok.startsWith('/') && !tok.startsWith('~') && !tok.includes('$') && !tok.includes('=') && !/^[a-z]+:\/\//i.test(tok))
    .filter((tok) => tok.includes('/') && isPathLike(tok) && !qualifiedName(tok))
    .map((tok): Span => ({ kind: 'path', text: tok, expect: 'present', ...(cwd ? { cwd } : {}), ...(hintDirs.length ? { hintDirs } : {}) }));
}

/** Every simple command in a shell line, plus the folders its `cd`s enter and the repository paths it names. */
export function commandSpans(line: string, hintDirs: string[] = []): Span[] {
  const spans: Span[] = [];
  for (const sc of splitShell(line)) {
    const cwd = sc.cwdUnknown ? undefined : sc.cwd || undefined;
    if (sc.argv[0] === 'cd' || sc.argv[0] === 'pushd') {
      const target = sc.argv[1];
      if (target && !target.startsWith('/') && !target.startsWith('~') && !target.includes('$') && target !== '-') {
        spans.push({ kind: 'path', text: `${target.replace(/\/$/, '')}/`, expect: 'present', ...(cwd ? { cwd } : {}) });
      }
      continue;
    }
    spans.push({ kind: 'command', text: sc.text, expect: 'present', ...(cwd ? { cwd } : {}), ...(hintDirs.length ? { hintDirs } : {}) });
    spans.push(...pathArgs(sc.argv, cwd, hintDirs));
  }
  return spans;
}

/** Tools whose name alone, in backticks, is a mention of an external program (`gh`, `kubectl`). */
const DISPATCHED = new Set(['yarn', 'npm', 'pnpm', 'bun', 'make', 'gmake', 'just', 'task', 'go', 'cargo', 'rake', 'composer', 'tox', 'nox', 'uv', 'poetry', 'pdm', 'hatch', 'python', 'python3', 'node', 'deno', 'bash', 'sh', 'source', 'time', 'env', 'export', 'find', 'echo', 'cat', 'ls', 'kill', 'ps', 'touch', 'cd', 'sudo']);

const FLAG_TOKEN = /^--?[A-Za-z][\w-]*$/;
const PLACEHOLDER = /^<[^>]+>$/;

const NOT_CALLS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'await', 'async', 'super', 'require', 'import', 'export', 'sizeof', 'defined', 'elif', 'print']);

/**
 * A code snippet (`export default [checkSchema(schema)]`), not a shell line: its claims are the functions
 * it calls. Null when the text reads as a command.
 */
function codeCalls(t: string): Span[] | null {
  const bare = t.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""').replace(/\$\(/g, ' ');
  const snippet = /^(?:export\s+(?:default|const|let|var|function|class|type|interface|async|\{)|import\s+[\w{*'"]|(?:const|let|var|function|class|def|func|return|await|new)\s)/.test(t) || /[A-Za-z_$][\w$]*\(/.test(bare) || /=>/.test(bare);
  if (!snippet) return null;
  const names = [...bare.matchAll(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/g)].map((m) => m[1] ?? '').filter((n) => n.length >= 3 && !NOT_CALLS.has(n));
  const spans = [...new Set(names)].map((n): Span => ({ kind: 'symbol', text: `${n}()`, expect: 'present' }));
  return spans.length ? spans : [{ kind: 'unknown', text: t, expect: 'present' }];
}

/** Classify inline code. Never discards: anything untyped comes back as `unknown`. */
export function classifyCode(code: string): Span[] {
  const t = code.trim().replace(/^\$\s+/, '');
  if (!t) return [];
  const first = t.split(/\s+/)[0] ?? '';
  // `--recover --keep-local`, `--run <id>`: flags, each checked on its own.
  const words = t.split(/\s+/);
  if (FLAG_TOKEN.test(first) && words.every((w) => FLAG_TOKEN.test(w) || PLACEHOLDER.test(w))) {
    return words.filter((w) => FLAG_TOKEN.test(w)).map((w): Span => ({ kind: 'symbol', text: w, expect: 'present' }));
  }
  // `(repo, branch, question_id)`: a list of names.
  const list = t.match(/^[([{]\s*([\w.]+(?:\s*,\s*[\w.]+)+)\s*[)\]}]$/);
  if (list?.[1]) return list[1].split(/\s*,\s*/).filter((n) => n.length >= 3 && /^[A-Za-z_]/.test(n)).map((n): Span => ({ kind: 'symbol', text: n, expect: 'present' }));
  // `reviewqa.Dir(sctx.EvidenceDir)`: the callee is the claim.
  const callee = t.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\((?:[^()]|\([^()]*\))*\)$/);
  if (callee?.[1] && callee[1].length >= 3) return [{ kind: 'symbol', text: `${callee[1]}()`, expect: 'present' }];
  // `"answer"`: a value spelled with its quotes.
  const quoted = t.match(/^"([\w.-]{3,})"$|^'([\w.-]{3,})'$/);
  if (quoted) return [{ kind: 'symbol', text: quoted[1] ?? quoted[2] ?? '', expect: 'present' }];
  if (!/\s/.test(t) && KNOWN_TOOLS.has(t) && !DISPATCHED.has(t)) return [{ kind: 'command', text: t, expect: 'present' }];
  if (/^(?:Test|Benchmark|Fuzz|Example)[A-Z_]\w*\/\S+$/.test(t) || /^refs\/[\w./<>-]+$/.test(t) || /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-?<[^>\s]+>$/.test(t)) return [{ kind: 'symbol', text: t, expect: 'present' }];
  if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(t) && !FILE_EXT.test(t)) return [{ kind: 'symbol', text: t, expect: 'present' }];
  if (/\s/.test(t) || /&&|\|\||;/.test(t)) {
    const calls = codeCalls(t);
    if (calls) return calls;
    if (KNOWN_TOOLS.has(first) || /^\.?\.?\/[\w./-]+$/.test(first) || /^[A-Za-z_][A-Za-z0-9_]*=\S*$/.test(first)) return commandSpans(t);
    // Not a command we know; still check any repository path it names (`helm install/upgrade` stays words).
    const paths = t
      .split(/\s+/)
      .filter((tok) => tok.includes('/') && isPathLike(tok) && !tok.startsWith('-') && !qualifiedName(tok))
      .map((tok): Span => ({ kind: 'path', text: tok, expect: 'present' }));
    return [{ kind: 'unknown', text: t, expect: 'present' }, ...paths];
  }
  if (/^[A-Z][A-Z0-9_]*=\S+$/.test(t)) return [{ kind: 'env', text: t, expect: 'present' }];
  // `@mui/material/styles`, `@material-ui/*`: an npm package (and a subpath of it), not a folder.
  const scoped = t.match(/^(@[a-z0-9][\w.-]*\/(?:[a-z0-9][\w.-]*|\*))(?:\/[\w./-]*)?$/);
  if (scoped?.[1]) return [{ kind: 'dependency', text: scoped[1], expect: 'present' }];
  if (qualifiedName(t) && (t.includes('/') || /^[a-z]/.test(t))) return [{ kind: 'symbol', text: t, expect: 'present' }];
  if (isPathLike(t)) return [{ kind: 'path', text: t, expect: 'present' }];
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*(\(\))?$/.test(t) && t.replace(/\(\)$/, '').length >= 3) return [{ kind: 'symbol', text: t, expect: 'present' }];
  return [{ kind: 'unknown', text: t, expect: 'present' }];
}

const VERSION_TECH =
  'Node(?:\\.js)?|Next\\.js|React|MUI|Material UI|PostgreSQL|Postgres|Redis|Valkey|TypeScript|Express(?:\\.js)?|Recoil|BullMQ|Knex|Sequelize|Prisma|Cypress|Jest|Vitest|Vite|Vue|Nuxt|Angular|Svelte|SvelteKit|Tailwind(?:CSS)?|Playwright|ESLint|Python|Go|Golang|Rust|Ruby|Java|Kotlin|PHP|Django|Rails|Laravel|Deno|Bun|pnpm|Yarn|npm|MySQL|MongoDB|Elasticsearch|Kafka|Gradle|Spring Boot|\\.NET';
const VERSION_RE = new RegExp(`(?<![\\w.])(${VERSION_TECH})\\s*(?:v|version\\s+)?(>=|≥|\\^|~)?\\s*(\\d+(?:\\.\\d+){0,2})(\\.x|\\+)?(?![\\w.]*\\d)`, 'g');

/** "Node 24+", "Node ≥26", "PostgreSQL 18": versions in prose. A version in quotes is a mention, not a claim. */
export function versionSpans(prose: string): Span[] {
  const unquoted = prose.replace(/"[^"]*"|“[^”]*”/g, ' ');
  return [...unquoted.matchAll(VERSION_RE)].map((m): Span => ({ kind: 'version', text: m[0].trim(), expect: 'present' }));
}

/** Products named in prose that resolve to packages ("Stripe", "Twilio"). Quoted names are mentions. */
export function dependencySpans(prose: string): Span[] {
  const unquoted = prose.replace(/"[^"]*"|“[^”]*”/g, ' ');
  const found = new Map<string, Span>();
  for (const alias of DEPENDENCY_ALIASES) {
    if (alias.pattern.test(unquoted) && !found.has(alias.name)) found.set(alias.name, { kind: 'dependency', text: alias.name, expect: 'present' });
  }
  // A version claim already checks the same product.
  const versioned = new Set(versionSpans(prose).map((v) => v.text.split(/\s|\d/)[0]?.toLowerCase()));
  return [...found.values()].filter((s) => !versioned.has(s.text.toLowerCase()));
}
