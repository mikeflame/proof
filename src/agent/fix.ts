import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RepoContext } from '../core/repo.ts';
import type { ProofConfig } from '../config.ts';
import type { DecisionRecord } from '../decisions.ts';
import type { Scope } from '../discover.ts';
import type { CheckedStatement } from '../model.ts';
import { runClaude } from './claude.ts';
import { checkEvidence } from './evidence.ts';
import { FIXER_RULES, FIXER_SCHEMA } from './rules.ts';

export interface FixOptions {
  model: string;
  effort: string;
  budgetUsd: number;
  timeoutMs: number;
  /** Edit user-level files too (never managed policy files). */
  user: boolean;
  config: ProofConfig;
}

export interface ProposedEdit {
  statementId: string;
  /** 1-based lines of the statement in the file before the edit. */
  line: number;
  endLine: number;
  tier: 'A' | 'B' | 'C';
  action: 'replace' | 'delete';
  old: string;
  new: string;
  evidence: { kind: string; ref: string; excerpt?: string | undefined; valid: boolean; problem: string }[];
  reason: string;
  /** The statement as it read before the edit. */
  was: string;
  /** Why proof will not apply it (policy, citation, a missing `old`); null when it may. */
  refused: string | null;
}

const TOOLS = ['Read', 'Grep', 'Glob', 'Bash'];
const ALLOWED = ['Read', 'Grep', 'Glob', 'Bash(git log:*)', 'Bash(git grep:*)', 'Bash(git ls-files:*)', 'Bash(git show:*)', 'Bash(ls:*)', 'Bash(wc:*)', 'Bash(find:*)', 'Bash(grep:*)', 'Bash(cat:*)', 'Bash(jq:*)'];

/** The statement's lines as written in the file. */
export const sourceOf = (source: string, st: { line: number; endLine: number }): string => source.split('\n').slice(st.line - 1, Math.max(st.line, st.endLine)).join('\n');

/** The evidence a fixer may see: the verdict's citations and the mechanical findings, never the verifier's reasoning. */
function evidenceOf(st: CheckedStatement): { kind: string; ref: string; excerpt?: string }[] {
  const out: { kind: string; ref: string; excerpt?: string }[] = [];
  for (const r of st.results) if (r.status === 'STALE' || r.status === 'VERIFIED') out.push({ kind: 'mechanical', ref: `${r.status.toLowerCase()} \`${r.text}\``, excerpt: `${r.reason}${r.evidence[0] ? ` (${r.evidence[0].ref})` : ''}`.slice(0, 200) });
  for (const e of st.agent?.evidence ?? []) if (e.valid) out.push({ kind: e.kind, ref: e.ref, ...(e.excerpt ? { excerpt: e.excerpt } : {}) });
  return out;
}

export function buildFixPrompt(file: string, source: string, stale: { key: string; st: CheckedStatement }[], records: DecisionRecord[], config: ProofConfig): string {
  const rejected = records.filter((r) => r.kind === 'fix-rejected').map((r) => ({ statement: r.previous ?? r.text, rejected_edit: r.edit?.new ?? null, why: r.reason }));
  const items = stale.map(({ key, st }) => ({ statement_id: key, lines: `${st.line}-${st.endLine}`, source: sourceOf(source, st), verdict: 'stale', evidence: evidenceOf(st) }));
  const tiers = (['A', 'B', 'C'] as const).filter((t) => config.autofix[t]);
  return [
    `You correct stale statements in the instruction file ${file} so they match the repository in your working directory.`,
    '',
    'Policy:',
    ...FIXER_RULES.map((r, i) => `${i + 1}. ${r}`),
    '',
    `Tiers allowed in this repository: ${tiers.join(', ') || 'none'}.`,
    `Ownership map: ${Object.keys(config.ownership).length ? JSON.stringify(config.ownership) : 'none; a pointer may only name the file the evidence came from'}.`,
    `Fixes rejected before (never propose these again): ${rejected.length ? JSON.stringify(rejected) : 'none'}.`,
    '',
    `Return one edit (or action none) for each of the ${stale.length} statement ids below.`,
    '',
    '<statements>',
    JSON.stringify(items, null, 1),
    '</statements>',
  ].join('\n');
}

interface RawEdit {
  statement_id?: unknown;
  tier?: unknown;
  action?: unknown;
  old?: unknown;
  new?: unknown;
  evidence?: unknown;
  reason?: unknown;
}

const isRule = (st: CheckedStatement) => st.residual.some((r) => r.startsWith('rule '));

/**
 * The policy of spec 5.4, applied by proof to what the fixer returns, so no prompt can loosen it: no
 * added lines, no deleted rules, a deletion only with evidence of absence, a citation that checks out,
 * the edit inside the statement's own lines, and never a managed or (without --user) a user file.
 */
export function vetEdit(repo: RepoContext, source: string, st: CheckedStatement, raw: RawEdit, scope: Scope, opts: FixOptions): ProposedEdit | null {
  if (raw.action !== 'replace' && raw.action !== 'delete') return null;
  const action = raw.action;
  const tier = raw.tier === 'A' || raw.tier === 'B' || raw.tier === 'C' ? raw.tier : 'B';
  const old = typeof raw.old === 'string' ? raw.old : action === 'delete' ? sourceOf(source, st) : '';
  const next = action === 'delete' ? '' : typeof raw.new === 'string' ? raw.new : '';
  const cited = Array.isArray(raw.evidence) ? raw.evidence.filter((e): e is { kind: string; ref: string; excerpt?: string } => Boolean(e) && typeof (e as { ref?: unknown }).ref === 'string' && typeof (e as { kind?: unknown }).kind === 'string') : [];
  const evidence = cited.slice(0, 6).map((e) => {
    const c = checkEvidence(repo, e);
    return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
  });
  const edit: ProposedEdit = { statementId: st.id, line: st.line, endLine: st.endLine, tier, action, old, new: next, evidence, reason: typeof raw.reason === 'string' ? raw.reason.slice(0, 600) : '', was: st.text, refused: null };
  const lines = sourceOf(source, st);
  const count = old ? lines.split(old).length - 1 : 0;
  const lineCount = (t: string) => t.split('\n').length;
  if (scope === 'managed') edit.refused = 'a managed policy file: proof reports it and never edits it';
  else if (scope === 'user' && !opts.user) edit.refused = 'a user-level file: pass --user to let proof edit it';
  else if (!opts.config.autofix[tier]) edit.refused = `tier ${tier} is switched off in .proof.yaml`;
  else if (!old) edit.refused = 'no `old` text to replace';
  else if (count !== 1) edit.refused = count ? '`old` appears more than once in the statement' : '`old` is not in the statement as written';
  else if (old === next) edit.refused = 'the edit changes nothing';
  else if (action === 'replace' && lineCount(next) > lineCount(old)) edit.refused = 'the edit adds lines; proof never adds content (gap proposals need --gaps)';
  else if (action === 'delete' && isRule(st)) edit.refused = 'a rule is rewritten to match the tooling, never deleted';
  else if (action === 'delete' && /\b(currently empty|(is|are) empty|none yet|not yet|no .{1,30} yet|nothing (here|yet)|placeholder)\b/i.test(st.text)) edit.refused = 'the statement itself says the thing is empty or absent; absence does not contradict it';
  else if (action === 'delete' && !evidence.some((e) => e.valid && e.kind === 'absence') && !st.results.some((r) => r.status === 'STALE' && /not found|does not exist|said to be gone/.test(r.reason))) edit.refused = 'a deletion needs evidence that the thing is absent';
  else if (!evidence.some((e) => e.valid)) edit.refused = evidence.length ? `no citation checks out (${evidence.map((e) => `${e.ref}: ${e.problem}`).join('; ').slice(0, 240)})` : 'an edit without evidence';
  return edit;
}

/** Ask the fixer for edits to the stale statements of one file, then vet each one. */
export async function proposeFixes(repo: RepoContext, file: string, scope: Scope, stale: CheckedStatement[], records: DecisionRecord[], opts: FixOptions): Promise<{ edits: ProposedEdit[]; costUsd: number; failure: string | null }> {
  const source = repo.read(file) ?? '';
  const keyed = stale.map((st, i) => ({ key: `s${i + 1}`, st }));
  const result = await runClaude({ cwd: repo.root, prompt: buildFixPrompt(file, source, keyed, records, opts.config), schema: FIXER_SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: opts.budgetUsd * 0.8, tools: TOOLS, allowedTools: ALLOWED, timeoutMs: opts.timeoutMs });
  if (!result.ok) return { edits: [], costUsd: result.costUsd, failure: `${result.subtype}${result.error ? ` (${result.error})` : ''}` };
  const raw = (result.structured as { edits?: RawEdit[] } | null)?.edits ?? [];
  const edits: ProposedEdit[] = [];
  for (const { key, st } of keyed) {
    const r = raw.find((e) => e.statement_id === key);
    const vetted = r ? vetEdit(repo, source, st, r, scope, opts) : null;
    if (vetted) edits.push(vetted);
  }
  return { edits, costUsd: result.costUsd, failure: null };
}

/**
 * Apply edits to the file's text, last line first so earlier positions hold. A line left with nothing
 * but a list marker after a deletion goes too.
 */
export function applyEdits(source: string, edits: ProposedEdit[]): string {
  const markerOnly = /^\s*(?:[-*+]|\d+[.)])?\s*$/;
  let lines = source.split('\n');
  for (const e of [...edits].sort((a, b) => b.line - a.line)) {
    const from = e.line - 1;
    const to = Math.max(e.line, e.endLine);
    const block = lines.slice(from, to).join('\n');
    const at = block.indexOf(e.old);
    if (at < 0) continue;
    const before = block.split('\n');
    const after = `${block.slice(0, at)}${e.new}${block.slice(at + e.old.length)}`.split('\n');
    const kept = e.action === 'delete' ? after.filter((l, i) => !(markerOnly.test(l) && !markerOnly.test(before[i] ?? 'x'))) : after;
    lines = [...lines.slice(0, from), ...kept, ...lines.slice(to)];
  }
  return lines.join('\n');
}

/** A unified diff of two texts, for the review after the fact, from git itself. */
export function unifiedDiff(file: string, before: string, after: string): string {
  if (before === after) return '';
  const dir = mkdtempSync(join(tmpdir(), 'proof-diff-'));
  try {
    writeFileSync(join(dir, 'a'), before);
    writeFileSync(join(dir, 'b'), after);
    const res = spawnSync('git', ['diff', '--no-index', '--no-color', '--no-ext-diff', '--', 'a', 'b'], { cwd: dir, encoding: 'utf8' });
    return res.stdout.replace(/^diff --git a\/a b\/b\n(index [^\n]*\n)?/, '').replace(/^--- a\/a$/m, `--- a/${file}`).replace(/^\+\+\+ b\/b$/m, `+++ b/${file}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
