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
let inputs;
try {
  ({ metafile: { inputs } } = await build({
    absWorkingDir: root,
    metafile: true,
    entryPoints: [join(root, 'src/cli.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    legalComments: 'none',
    outfile: join(tmp, 'proof-bundle.mjs'),
    define: { __PROOF_VERSION__: JSON.stringify(pkg.version) },
    // The bundle is ESM; libraries that call require() need a real one.
    banner: { js: "import { createRequire as __proofRequire } from 'node:module'; const require = __proofRequire(import.meta.url);" },
  }));
  emit(join(out, 'proof-bundle.mjs'), readFileSync(join(tmp, 'proof-bundle.mjs')));
  // The entry point checks the Node version against `engines` before it loads the bundle.
  const floor = /^>=\s*(\d+)/.exec(pkg.engines?.node ?? '')?.[1];
  if (!floor) throw new Error('package.json engines.node must be ">=<major>"');
  emit(join(out, 'proof.mjs'), readFileSync(join(root, 'src/entry.mjs.tmpl'), 'utf8').replaceAll('__NODE_FLOOR__', floor));
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

// Third-party notices next to the bundle: every npm package esbuild put into it, and the repository and
// ref each grammar file is built from. The build fails rather than ship code without its license.
const tidy = (t) => t.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim();
const MIT_TERMS = tidy(readFileSync(join(root, 'LICENSE'), 'utf8').slice(readFileSync(join(root, 'LICENSE'), 'utf8').indexOf('Permission is hereby granted')));

/** A bundled package's license text: its license file, or for an MIT package without one, its source header with the MIT terms. */
function packageLicense(dir, pj) {
  const type = pj.license ?? pj.licenses?.map((l) => l.type).join(' OR ');
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  if (file) return { type, text: tidy(readFileSync(join(dir, file), 'utf8')) };
  const main = join(dir, pj.main ?? 'index.js');
  const header = existsSync(main) ? readFileSync(main, 'utf8').match(/^(?:[ \t]*\/\/.*\n)+/)?.[0] : null;
  if (type === 'MIT' && header && /copyright/i.test(header)) return { type, text: `${tidy(header.replace(/^[ \t]*\/\/ ?/gm, ''))}\n\n${MIT_TERMS}` };
  throw new Error(`${pj.name}@${pj.version} is bundled but ships no license text this build can include`);
}

function noticesFile() {
  const packages = new Map();
  for (const input of Object.keys(inputs)) {
    const dir = input.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//)?.[1];
    if (!dir || packages.has(dir)) continue;
    const pj = JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'));
    packages.set(dir, { id: `${pj.name} ${pj.version}`, ...packageLicense(join(root, dir), pj) });
  }
  // Packages under the same license text share one copy of it.
  const byText = new Map();
  for (const p of packages.values()) byText.set(p.text, [...(byText.get(p.text) ?? []), p]);
  const groups = [...byText.entries()].map(([text, ps]) => ({ text, type: ps[0].type, ids: ps.map((p) => p.id).sort() })).sort((a, b) => a.ids[0].localeCompare(b.ids[0]));

  const sources = JSON.parse(readFileSync(join(root, 'src/notices/grammars.json'), 'utf8'));
  const installed = JSON.parse(readFileSync(join(wasm, '..', 'package.json'), 'utf8')).version;
  if (installed !== sources.version) throw new Error(`@vscode/tree-sitter-wasm is ${installed} but src/notices/grammars.json describes ${sources.version}: re-derive it as its "source" says`);
  const shipped = [...wanted.keys()].filter((f) => f !== 'LICENSE');
  const unsourced = shipped.filter((f) => !sources.components.some((c) => Array.isArray(c.files) && c.files.includes(f)));
  if (unsourced.length) throw new Error(`no source in src/notices/grammars.json for grammars/${unsourced.join(', grammars/')}`);
  const components = sources.components.filter((c) => c.files === '*' || c.files.some((f) => shipped.includes(f)));

  const block = (text) => ['```', text, '```'];
  return [
    '# Third-party notices',
    '',
    '`proof-bundle.mjs` bundles the npm packages below, and `grammars/` holds WebAssembly builds of the',
    'tree-sitter repositories below. Each is used under the license printed with it. Generated by the build;',
    'do not edit.',
    '',
    '## Bundled into proof-bundle.mjs',
    '',
    ...groups.flatMap((g) => [`### ${g.ids.join(', ')}`, '', `License: ${g.type}`, '', ...block(g.text), '']),
    '## grammars/',
    '',
    ...components.flatMap((c) => {
      const files = c.files === '*' ? 'every file in `grammars/`' : c.files.filter((f) => shipped.includes(f)).map((f) => `\`${f}\``).join(', ');
      return [`### ${c.name}`, '', `${files}: built from ${c.repo} at \`${c.ref}\`. License: ${c.license}.${c.note ? ` ${c.note}` : ''}`, '', ...block(c.text), ''];
    }),
  ].join('\n');
}
emit(join(out, 'THIRD_PARTY_NOTICES.md'), noticesFile());
// proof's own license travels with the skill: the plugin and `proof install` copy only the skill folder.
emit(join(skill, 'LICENSE'), readFileSync(join(root, 'LICENSE')));

// SKILL.md from its template and the shared vocabulary.
const template = readFileSync(join(root, 'src/skill/SKILL.md.tmpl'), 'utf8');
emit(join(skill, 'SKILL.md'), template.replace('{{STATUS_TABLE}}', statusTable()).replace('{{VERDICT_TABLE}}', verdictTable()));

/** The evaluation numbers of spec 9.6 and the run times of criterion 13, from eval/. */
function metricsBlock(metrics, perf, corpus) {
  if (!metrics) return '_No evaluation has been scored yet: run `node eval/score.mjs`._';
  const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
  const row = (key, label) => {
    const g = metrics.groups[key];
    if (!g) return null;
    return `| ${label} | ${g.repos} | ${g.labeled} | ${pct(g.stalePrecision)} (${g.staleFlagged} flagged) | ${pct(g.staleRecall)} (${g.staleGold} stale) | ${pct(g.verifiedPrecision)} (${g.verified}) | ${g.fixes ? `${pct(g.fixAcceptance)} (${g.fixes})` : '—'} |`;
  };
  const rows = [
    row('check/tune', '`proof check`, tune'),
    row('run/tune', '`proof run`, tune'),
    row('check/heldout', '`proof check`, held-out'),
    row('run/heldout', '`proof run`, held-out'),
  ].filter(Boolean);
  const tune = corpus.filter((c) => c.split === 'tune').length;
  const held = corpus.filter((c) => c.split === 'heldout').length;
  const lines = [
    `Corpus: ${corpus.length} public repositories pinned to commits (${tune} tune, ${held} held-out, never run while tuning), one instruction file each. Labels: ${metrics.labeler}${metrics.adjudicated ? `; ${metrics.adjudicated} label${metrics.adjudicated === 1 ? '' : 's'} changed in that review, with the evidence in the label file` : ''}.`,
    '',
    '| Stage, split | Repos | Labeled statements | STALE precision | STALE recall | VERIFIED precision | Fixes kept |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
  ];
  const perfReview = existsSync(join(root, 'eval', 'labels', 'deno.fixes.json')) ? JSON.parse(readFileSync(join(root, 'eval', 'labels', 'deno.fixes.json'), 'utf8')).fixes : null;
  const reviewed = perfReview ? ` An independent review of that diff kept ${perfReview.filter((f) => f.keep).length} of ${perfReview.length} fixes.` : '';
  if (perf) lines.push('', `Run time on ${perf.repo} (${perf.files.toLocaleString('en-US')} files, ${perf.full.open} open statements in ${perf.file}): a full \`proof run\` took ${Math.round(perf.full.seconds / 60)} minutes and $${perf.full.spentUsd} (${perf.full.fixed} statements fixed, ${perf.full.fixRejected} fix rejected); the re-run after the fixes took ${perf.rerun.seconds} seconds and $${perf.rerun.spentUsd}.${reviewed}`);
  return lines.join('\n');
}

// The README's generated blocks.
const corpusFile = join(root, 'eval', 'corpus.json');
const corpus = existsSync(corpusFile) ? JSON.parse(readFileSync(corpusFile, 'utf8')).repos : [];
const metricsFile = join(root, 'eval', 'metrics.json');
const perfFile = join(root, 'eval', 'perf.json');
const blocks = { statuses: statusTable(), verdicts: verdictTable(), commands: commandTable(), matrix: matrixTable(corpus), metrics: metricsBlock(existsSync(metricsFile) ? JSON.parse(readFileSync(metricsFile, 'utf8')) : null, existsSync(perfFile) ? JSON.parse(readFileSync(perfFile, 'utf8')) : null, corpus) };
let readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- generated:${name} -->\\n)[\\s\\S]*?(<!-- /generated:${name} -->)`);
  if (!re.test(readme)) throw new Error(`README.md has no generated:${name} block`);
  // A replacer function: `$2.37` in the body must not read as a backreference.
  readme = readme.replace(re, (_, open, close) => `${open}${body}\n${close}`);
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
console.log(check ? 'everything generated is up to date' : `built proof ${pkg.version}: bundle, ${wanted.size} grammar files, third-party notices, LICENSE, SKILL.md, README tables, plugin manifest`);
