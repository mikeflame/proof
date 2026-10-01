// The fixes proof proposed (proof run --dry-run) for each corpus file, for an independent keep/revert review.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'todo'), { recursive: true });
const only = process.argv[2];
for (const r of corpus().filter((x) => !only || x.split === only || x.name === only)) {
  const file = join(here, 'results', `${r.name}.fixes.json`);
  if (!existsSync(file)) continue;
  const report = JSON.parse(readFileSync(file, 'utf8')).report;
  const fixes = (report.fixes ?? []).filter((f) => f.outcome === 'dry-run').map((f) => {
    const st = report.statements.find((s) => s.id === f.statement_id);
    return { statement_id: f.statement_id, line: f.line, statement: st?.text ?? '', old: f.old, new: f.new, action: f.action, tier: f.tier, evidence: st?.fix?.evidence?.filter((e) => e.valid).map((e) => `${e.kind} ${e.ref}${e.excerpt ? ` "${e.excerpt}"` : ''}`) ?? [] };
  });
  writeFileSync(join(here, 'todo', `${r.name}.fixes.json`), `${JSON.stringify({ repo: r.repo, sha: r.sha, file: r.file, fixes }, null, 1)}\n`);
  console.log(`${r.name.padEnd(16)} ${fixes.length} proposed fixes`);
}
