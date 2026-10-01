// The statements of each corpus file as proof splits them, without any verdict, for independent labeling.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus, corpusDir } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const bundle = join(here, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');

/** Statements to label: all of them up to `limit`, else an even sample (every k-th, deterministic). */
export function toLabel(statements, limit = 90) {
  if (statements.length <= limit) return statements;
  const step = statements.length / limit;
  return Array.from({ length: limit }, (_, i) => statements[Math.floor(i * step)]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2];
  mkdirSync(join(here, 'todo'), { recursive: true });
  for (const r of corpus().filter((x) => !only || x.split === only || x.name === only)) {
    const res = spawnSync(process.execPath, [bundle, 'check', r.file, '--json'], { cwd: join(corpusDir(), r.name), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    const report = JSON.parse(res.stdout).find((x) => x.file === r.file);
    const all = report.statements.map((s) => ({ id: s.id, line: s.line, kind: s.kind, section: s.section, text: s.text }));
    const sample = toLabel(all);
    writeFileSync(join(here, 'todo', `${r.name}.json`), `${JSON.stringify({ repo: r.repo, sha: r.sha, file: r.file, total: all.length, sampled: sample.length, statements: sample }, null, 1)}\n`);
    console.log(`${r.name.padEnd(16)} ${all.length} statements, ${sample.length} to label`);
  }
}
