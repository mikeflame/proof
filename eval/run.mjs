// Run proof over the corpus and keep its reports: `node eval/run.mjs <split|name> [--agent] [--fixes] [--budget <usd>]`.
// --agent runs the verifier stage (proof run --no-fix); --fixes asks for fix proposals (proof run --dry-run).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus, corpusDir } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = join(here, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');
const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith('--') && !/^\d/.test(a));
const budget = args.includes('--budget') ? args[args.indexOf('--budget') + 1] : '4';
const proofCommit = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: join(here, '..'), encoding: 'utf8' }).stdout.trim();

/** The results are committed; the corpus folder is this machine's, so its path is written as `<corpus>`. */
const scrub = (v) => (typeof v === 'string' ? v.split(corpusDir()).join('<corpus>') : Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)])) : v);

function stage(r, name, cliArgs) {
  const started = Date.now();
  const res = spawnSync(process.execPath, [bundle, ...cliArgs, r.file, '--json'], { cwd: join(corpusDir(), r.name), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const reports = JSON.parse(res.stdout || '[]');
  const report = reports.find((x) => x.file === r.file);
  if (!report) throw new Error(`${r.name} ${name}: no report (${res.stderr.slice(0, 300)})`);
  writeFileSync(join(here, 'results', `${r.name}.${name}.json`), `${JSON.stringify({ proof: proofCommit, stage: name, seconds: Math.round((Date.now() - started) / 1000), exit: res.status, report: scrub(report) }, null, 1)}\n`);
  console.log(`${r.name.padEnd(16)} ${name.padEnd(6)} ${report.verdict.padEnd(14)} ${JSON.stringify(report.counts)} ${Math.round((Date.now() - started) / 1000)} s${report.run.budgetUsedUsd !== undefined ? ` $${report.run.budgetUsedUsd.toFixed(2)}` : ''}`);
}

for (const r of corpus().filter((x) => !only || x.split === only || x.name === only)) {
  stage(r, 'check', ['check']);
  if (args.includes('--agent')) stage(r, 'run', ['run', '--no-fix', '--budget-usd', budget]);
  if (args.includes('--fixes')) stage(r, 'fixes', ['run', '--dry-run', '--budget-usd', budget]);
}
