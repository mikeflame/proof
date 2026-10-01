// Builds everything users get from src/: the bundle and its grammars, SKILL.md, the README's generated
// tables, and the plugin manifest version. `--check` builds into memory and fails on any difference
// from what is committed (spec 9.2, criterion 11).
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { GRAMMARS } from '../src/core/syntax.ts';
import { commandTable, matrixTable, statusTable, verdictTable } from '../src/vocabulary.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const skill = join(root, 'plugins/proof/skills/claude-md');
const out = join(skill, 'scripts');
const wasm = join(dirname(createRequire(import.meta.url).resolve('@vscode/tree-sitter-wasm/package.json')), 'wasm');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const drift = [];

/** Write `content` to `file`, or in --check mode record that it differs. */
function emit(file, content) {
  const current = existsSync(file) ? readFileSync(file) : null;
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (current?.equals(next)) return;
  if (check) drift.push(file.slice(root.length + 1));
  else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, next);
  }
}

// The bundle, built into a temporary folder first so --check never touches the committed one.
const tmp = mkdtempSync(join(tmpdir(), 'proof-build-'));
try {
  await build({
    entryPoints: [join(root, 'src/cli.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    legalComments: 'none',
    outfile: join(tmp, 'proof.mjs'),
    // The bundle is ESM; libraries that call require() need a real one.
    banner: { js: "#!/usr/bin/env node\nimport { createRequire as __proofRequire } from 'node:module'; const require = __proofRequire(import.meta.url);" },
  });
  emit(join(out, 'proof.mjs'), readFileSync(join(tmp, 'proof.mjs')));
  // Executable, so `npx` and a plain `./proof.mjs` run it.
  if (!check && existsSync(join(out, 'proof.mjs'))) chmodSync(join(out, 'proof.mjs'), 0o755);
  else if (check && existsSync(join(out, 'proof.mjs')) && !(statSync(join(out, 'proof.mjs')).mode & 0o100)) drift.push('plugins/proof/skills/claude-md/scripts/proof.mjs (not executable)');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// The tree-sitter runtime (renamed .cjs: a "type": "module" package.json above it would make Node load
// a .js file as ESM) and one grammar per language the checks parse.
const grammars = join(out, 'grammars');
const wanted = new Map([['tree-sitter.cjs', 'tree-sitter.js'], ['tree-sitter.wasm', 'tree-sitter.wasm'], ['LICENSE', '../LICENSE'], ...GRAMMARS.map((g) => [`tree-sitter-${g}.wasm`, `tree-sitter-${g}.wasm`])]);
for (const [name, from] of wanted) {
  if (!existsSync(join(wasm, from))) throw new Error(`@vscode/tree-sitter-wasm has no ${from}`);
  emit(join(grammars, name), readFileSync(join(wasm, from)));
}
if (existsSync(grammars)) {
  for (const extra of readdirSync(grammars).filter((f) => !wanted.has(f))) {
    if (check) drift.push(`plugins/proof/skills/claude-md/scripts/grammars/${extra} (not built)`);
    else rmSync(join(grammars, extra));
  }
}

// SKILL.md from its template and the shared vocabulary.
const template = readFileSync(join(root, 'src/skill/SKILL.md.tmpl'), 'utf8');
emit(join(skill, 'SKILL.md'), template.replace('{{STATUS_TABLE}}', statusTable()).replace('{{VERDICT_TABLE}}', verdictTable()));

// The README's generated blocks.
const corpusFile = join(root, 'eval', 'corpus.json');
const corpus = existsSync(corpusFile) ? JSON.parse(readFileSync(corpusFile, 'utf8')).repos : [];
const blocks = { statuses: statusTable(), verdicts: verdictTable(), commands: commandTable(), matrix: matrixTable(corpus) };
let readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- generated:${name} -->\\n)[\\s\\S]*?(<!-- /generated:${name} -->)`);
  if (!re.test(readme)) throw new Error(`README.md has no generated:${name} block`);
  readme = readme.replace(re, `$1${body}\n$2`);
}
emit(join(root, 'README.md'), readme);

// One version: package.json, written into the plugin manifest.
const manifestFile = join(root, 'plugins/proof/.claude-plugin/plugin.json');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
emit(manifestFile, `${JSON.stringify({ ...manifest, version: pkg.version }, null, 2)}\n`);

if (check && drift.length) {
  console.error(`out of date (run npm run build and commit):\n  ${drift.join('\n  ')}`);
  process.exit(1);
}
console.log(check ? 'everything generated is up to date' : `built proof ${pkg.version}: bundle, ${wanted.size} grammar files, SKILL.md, README tables, plugin manifest`);
