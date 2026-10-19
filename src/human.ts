// The commands a person (or the skill, relaying a person) runs: decide an open statement, revert a fix.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { checkEvidence } from './agent/evidence.ts';
import { DEFAULT_VERIFY } from './agent/verify.ts';
import { appendDecisions, type DecisionRecord, loadDecisions } from './decisions.ts';
import type { CheckedStatement } from './model.ts';
import type { Run } from './pipeline.ts';

export class HumanError extends Error {}

/** The person recording a decision: `git config user.name`, then `$USER`. */
export function whoAmI(root: string): string {
  const res = spawnSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8' });
  return (res.status === 0 && res.stdout.trim()) || process.env.USER || 'unknown';
}

/** `L12` or a statement id prefix of at least 6 characters. */
function pick(statements: CheckedStatement[], which: string): CheckedStatement {
  const line = /^L?(\d+)$/i.exec(which);
  const found = line ? statements.filter((s) => s.line === Number(line[1])) : statements.filter((s) => which.length >= 6 && s.id.startsWith(which));
  if (!found.length) throw new HumanError(`no statement ${which}; list them with: proof decide <file>`);
  if (found.length > 1) throw new HumanError(`${which} matches ${found.length} statements; use the id: ${found.map((s) => s.id.slice(0, 10)).join(', ')}`);
  return found[0] as CheckedStatement;
}

const OPEN = new Set(['UNCONFIRMED', 'UNVERIFIED_WITH_REASON']);

/** The open statements of a file, one line each, for a person to decide. */
export async function listOpen(run: Run, file: string): Promise<string> {
  const checked = await run.checkTargets([{ file, why: 'named on the command line', scope: 'project' }]);
  // The verifier's verdicts from the last `proof run`, read from its cache: listing never calls it.
  const [report] = checked.length ? await run.verify(checked, { ...DEFAULT_VERIFY, cacheOnly: true }) : [];
  const open = (report?.statements ?? []).filter((s) => OPEN.has(s.status));
  if (!open.length) return `${file}: no open statements to decide.\n`;
  return `${open.map((s) => `L${s.line}  ${s.id.slice(0, 10)}  ${s.text.slice(0, 120)}\n    ${s.agent?.reason ? `verifier: ${s.agent.reason}` : s.reason}`).join('\n')}\n\nDecide one: proof decide ${file} L<line> --rule --reason "…"  or  --fact --evidence <path:line> --reason "…"\n`;
}

/**
 * Record a person's decision on an open statement (spec 4.5): a rule needs a reason; a fact also needs
 * evidence that checks out. A statement the repository contradicts cannot be decided away.
 */
export async function decide(run: Run, file: string, which: string, opts: { kind: 'rule' | 'fact'; reason: string; evidence: string[]; by?: string }): Promise<DecisionRecord> {
  if (!opts.reason.trim()) throw new HumanError('a decision needs --reason "…"');
  const [report] = await run.checkTargets([{ file, why: 'named on the command line', scope: 'project' }]);
  if (!report || !report.statements.length) throw new HumanError(`${file} has no statements`);
  const st = pick(report.statements, which);
  if (st.status === 'STALE' || st.status === 'FIX_REJECTED') throw new HumanError(`L${st.line} is stale: the repository contradicts it (${st.reason}). Fix or delete the line instead of deciding it.`);
  if (st.status === 'VERIFIED' || st.status === 'DECIDED') throw new HumanError(`L${st.line} is already ${st.status.toLowerCase()}; nothing to decide`);
  const evidence = opts.evidence.map((ref) => checkEvidence(run.repo, { kind: /:\d+(-\d+)?$/.test(ref) ? 'file_line' : 'command_output', ref }));
  if (opts.kind === 'fact') {
    if (!evidence.length) throw new HumanError('a fact needs --evidence <path:line>; never decide a fact without evidence');
    const bad = evidence.find((e) => !e.valid);
    if (bad) throw new HumanError(`--evidence ${bad.ref} does not check out: ${bad.problem}`);
  }
  const record: DecisionRecord = {
    statement_id: st.id,
    text: st.text,
    kind: opts.kind,
    reason: opts.reason.trim(),
    evidence: evidence.map(({ kind, ref }) => ({ kind, ref })),
    by: opts.by ?? whoAmI(run.repo.root),
    at: new Date().toISOString(),
    tree: run.git?.tree ?? null,
    head: run.git?.head ?? null,
  };
  appendDecisions(run.repo.root, report.file, [record]);
  return record;
}

/** Undo one applied fix by the id of the statement it produced, and record that a person rejected it. */
export function revert(run: Run, file: string, id: string, by?: string): DecisionRecord {
  const rel = run.repo.rel(file) ?? file;
  const { records } = loadDecisions(run.repo.root, rel);
  const fixed = [...records].reverse().find((r) => r.kind === 'fixed' && id.length >= 6 && r.statement_id.startsWith(id));
  if (!fixed?.edit) throw new HumanError(`no applied fix for ${id} in the sidecar of ${rel}`);
  const text = run.repo.read(rel) ?? '';
  const { old, new: next } = fixed.edit;
  let reverted: string;
  if (next) {
    const count = text.split(next).length - 1;
    if (count !== 1) throw new HumanError(count ? 'the fixed text appears more than once; revert it by hand' : 'the fixed text is no longer in the file; it was edited since');
    reverted = text.replace(next, old);
  } else {
    const lines = text.split('\n');
    const at = Math.max(0, Math.min(lines.length, (fixed.line ?? 1) - 1));
    reverted = [...lines.slice(0, at), old, ...lines.slice(at)].join('\n');
  }
  writeFileSync(isAbsolute(rel) ? rel : join(run.repo.root, rel), reverted);
  const record: DecisionRecord = { statement_id: fixed.statement_id, text: fixed.previous ?? '', kind: 'fix-rejected', reason: `reverted by ${by ?? whoAmI(run.repo.root)}`, evidence: [], by: by ?? whoAmI(run.repo.root), at: new Date().toISOString(), tree: run.git?.tree ?? null, head: run.git?.head ?? null, previous: fixed.previous, tier: fixed.tier, edit: fixed.edit };
  appendDecisions(run.repo.root, rel, [record]);
  return record;
}
