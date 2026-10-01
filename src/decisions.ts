import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import type { CheckedStatement } from './model.ts';

/** One recorded fact of a run: a human decision, a fix, an override, a rejected fix. Spec 4.5. */
export interface DecisionRecord {
  statement_id: string;
  /** The statement as decided (for `fixed`, the new text). */
  text: string;
  kind: 'rule' | 'fact' | 'fixed' | 'override' | 'fix-rejected';
  reason: string;
  evidence: { kind: string; ref: string; excerpt?: string | undefined }[];
  by: string;
  at: string;
  tree: string | null;
  head: string | null;
  /** For `fixed` and `fix-rejected`: the text before the edit, the edit's tier, and the source edit itself. */
  previous?: string | undefined;
  tier?: string | undefined;
  edit?: { old: string; new: string } | undefined;
  /** The line the edit started at, so a deletion can be put back. */
  line?: number | undefined;
}

/** The sidecar of an instruction file: `CLAUDE.md` → `CLAUDE.md.proof.json`, committed next to it. */
export const sidecarPath = (file: string): string => `${file}.proof.json`;

export function loadDecisions(root: string, file: string): { records: DecisionRecord[]; error: string | null } {
  const path = isAbsolute(file) ? sidecarPath(file) : join(root, sidecarPath(file));
  if (!existsSync(path)) return { records: [], error: null };
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!Array.isArray(data)) return { records: [], error: `${sidecarPath(file)} is not an array of records` };
    return { records: data.filter((r): r is DecisionRecord => Boolean(r) && typeof (r as DecisionRecord).statement_id === 'string' && typeof (r as DecisionRecord).kind === 'string'), error: null };
  } catch (err) {
    return { records: [], error: `${sidecarPath(file)} does not parse (${err instanceof Error ? err.message.split('\n')[0] : String(err)})` };
  }
}

export function appendDecisions(root: string, file: string, add: DecisionRecord[]): void {
  if (!add.length) return;
  const { records } = loadDecisions(root, file);
  const path = isAbsolute(file) ? sidecarPath(file) : join(root, sidecarPath(file));
  writeFileSync(path, `${JSON.stringify([...records, ...add], null, 2)}\n`);
}

const ageCache = new Map<string, number | null>();

/** Commits since `head`, or null when it is not an ancestor any more. */
export function commitsSince(root: string, head: string | null): number | null {
  if (!head) return null;
  const key = `${root}\0${head}`;
  if (!ageCache.has(key)) {
    const res = spawnSync('git', ['rev-list', '--count', `${head}..HEAD`], { cwd: root, encoding: 'utf8' });
    ageCache.set(key, res.status === 0 ? Number(res.stdout.trim()) : null);
  }
  return ageCache.get(key) ?? null;
}

export interface Replay {
  statements: CheckedStatement[];
  /** Decisions whose statement text no longer appears in the file: the line was edited, so it is open again. */
  reopened: DecisionRecord[];
}

/**
 * Replay recorded decisions (spec 4.5): a rule or fact decision whose text still matches is DECIDED, with
 * its age in commits, unless the repository now contradicts it (stale evidence beats a decision, D3).
 */
export function replayDecisions(root: string, statements: CheckedStatement[], records: DecisionRecord[]): Replay {
  const decisions = new Map<string, DecisionRecord>();
  for (const r of records) if (r.kind === 'rule' || r.kind === 'fact') decisions.set(r.statement_id, r);
  const ids = new Set(statements.map((s) => s.id));
  const reopened = [...decisions.values()].filter((r) => !ids.has(r.statement_id));
  const out = statements.map((s): CheckedStatement => {
    const d = decisions.get(s.id);
    if (!d || s.kind === 'marker' || s.status === 'OVERRIDDEN') return s;
    const age = commitsSince(root, d.head);
    const when = age === null ? `on ${d.at.slice(0, 10)}` : age === 0 ? 'at the current commit' : `${age} commit${age === 1 ? '' : 's'} ago`;
    if (s.status === 'STALE') return { ...s, reason: `${s.reason} (decided as a ${d.kind} by ${d.by} ${when}, but the repository now contradicts it)` };
    return { ...s, status: 'DECIDED', reason: `decided as a ${d.kind} by ${d.by} ${when}: ${d.reason}`, settled: true };
  });
  return { statements: out, reopened };
}
