// Score proof's reports against the gold labels: spec 9.6 metrics, per stage and split, into eval/metrics.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus } from './fetch.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const load = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const norm = (t) => t.replace(/\s+/g, ' ').trim().toLowerCase();
const STALE = new Set(['STALE', 'FIX_REJECTED']);

/** Gold label for a reported statement: by id, else by text near the same line. */
function goldFor(labels, st) {
  const l = labels.find((x) => x.id === st.id) ?? labels.find((x) => norm(x.text) === norm(st.text) && Math.abs(x.line - st.line) <= 3) ?? null;
  // A second reviewer's adjudication, with its evidence, replaces the first label.
  return l?.adjudicated ? { ...l, label: l.adjudicated.label } : l;
}

function tally(rows) {
  const t = { statements: 0, labeled: 0, tp: 0, fp: 0, fn: 0, verified: 0, verifiedTrue: 0, fixes: 0, fixesKept: 0, cost: 0, seconds: 0, repos: 0 };
  for (const r of rows) for (const k of Object.keys(t)) t[k] += r[k] ?? 0;
  return t;
}

const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);

function summary(t) {
  return { repos: t.repos, statements: t.statements, labeled: t.labeled, staleFlagged: t.tp + t.fp, staleGold: t.tp + t.fn, stalePrecision: pct(t.tp, t.tp + t.fp), staleRecall: pct(t.tp, t.tp + t.fn), verified: t.verified, verifiedPrecision: pct(t.verifiedTrue, t.verified), fixes: t.fixes, fixAcceptance: pct(t.fixesKept, t.fixes), costUsd: Math.round(t.cost * 100) / 100, seconds: t.seconds };
}

const perRepo = [];
for (const r of corpus()) {
  const gold = load(join(here, 'labels', `${r.name}.json`));
  if (!gold) continue;
  for (const stageName of ['check', 'run']) {
    // The run stage is scored on the full pipeline report (verify, then fix proposals) when there is one;
    // its cost and time are both stages together.
    const verifyOnly = load(join(here, 'results', `${r.name}.${stageName}.json`));
    const full = stageName === 'run' ? load(join(here, 'results', `${r.name}.fixes.json`)) : null;
    const result = full && verifyOnly ? { ...full, seconds: full.seconds + verifyOnly.seconds, report: { ...full.report, run: { ...full.report.run, budgetUsedUsd: (full.report.run.budgetUsedUsd ?? 0) + (verifyOnly.report.run.budgetUsedUsd ?? 0) } } } : (full ?? verifyOnly);
    if (!result) continue;
    const row = { name: r.name, split: r.split, ecosystem: r.ecosystem, stage: stageName, statements: result.report.statements.length, labeled: 0, tp: 0, fp: 0, fn: 0, verified: 0, verifiedTrue: 0, fixes: 0, fixesKept: 0, cost: result.report.run.budgetUsedUsd ?? 0, seconds: result.seconds, repos: 1, misses: [], falseAlarms: [], wrongVerified: [] };
    for (const st of result.report.statements) {
      const g = goldFor(gold.labels, st);
      if (!g) continue;
      row.labeled += 1;
      const flagged = STALE.has(st.status);
      if (flagged && g.label === 'stale') row.tp += 1;
      else if (flagged) row.fp += 1, row.falseAlarms.push(`L${st.line} ${st.text.slice(0, 90)}`);
      else if (g.label === 'stale') row.fn += 1, row.misses.push(`L${st.line} ${st.text.slice(0, 90)}`);
      if (st.status === 'VERIFIED') {
        row.verified += 1;
        if (g.label === 'true') row.verifiedTrue += 1;
        else row.wrongVerified.push(`L${st.line} (${g.label}) ${st.text.slice(0, 90)}`);
      }
    }
    if (stageName === 'run') {
      const fixGold = load(join(here, 'labels', `${r.name}.fixes.json`));
      const proposed = load(join(here, 'results', `${r.name}.fixes.json`))?.report.fixes?.filter((f) => f.outcome === 'dry-run') ?? [];
      for (const f of proposed) {
        const verdict = fixGold?.fixes.find((x) => x.statement_id === f.statement_id && x.new === f.new);
        if (!verdict) continue;
        row.fixes += 1;
        if (verdict.keep) row.fixesKept += 1;
      }
    }
    perRepo.push(row);
  }
}

const groups = {};
for (const stageName of ['check', 'run']) for (const split of ['tune', 'heldout', 'all']) {
  const rows = perRepo.filter((x) => x.stage === stageName && (split === 'all' || x.split === split));
  if (rows.length) groups[`${stageName}/${split}`] = summary(tally(rows));
}
const adjudicated = corpus().reduce((n, r) => n + (load(join(here, 'labels', `${r.name}.json`))?.labels.filter((l) => l.adjudicated).length ?? 0), 0);
const metrics = { adjudicated, generated: new Date().toISOString().slice(0, 10), labeler: 'independent agent labels with cited evidence; a second, human review is pending', groups, perRepo };
writeFileSync(join(here, 'metrics.json'), `${JSON.stringify(metrics, null, 1)}\n`);
for (const [k, v] of Object.entries(groups)) console.log(k.padEnd(14), JSON.stringify(v));
for (const r of perRepo) if (r.misses.length || r.falseAlarms.length || r.wrongVerified.length) console.log(`\n${r.name} ${r.stage}:`, JSON.stringify({ misses: r.misses, falseAlarms: r.falseAlarms, wrongVerified: r.wrongVerified }, null, 1));
