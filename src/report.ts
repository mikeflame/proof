import type { CheckedStatement, SpanResult, StatementStatus } from './model.ts';
import type { FileReport } from './pipeline.ts';

const MARK: Record<string, string> = { VERIFIED: '✓', STALE: '✗', UNCONFIRMED: '?', NOT_CHECKED: '·' };
const clip = (raw: string, n = 160) => {
  const t = raw.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Report sections in the order of spec 7.1, with the hint each one carries. */
export const SECTIONS: { status: StatementStatus; title: string; hint: string; expand: 'always' | 'verbose' }[] = [
  { status: 'FIXED', title: 'Fixed', hint: 'Edited and re-verified. Review the diff.', expand: 'always' },
  { status: 'FIX_REJECTED', title: 'Fix rejected', hint: 'The re-verifier rejected these edits; they were reverted.', expand: 'always' },
  { status: 'STALE', title: 'Stale', hint: 'The repository contradicts these.', expand: 'always' },
  { status: 'UNCONFIRMED', title: 'Unconfirmed', hint: 'Part of each has no evidence; nothing contradicts it either.', expand: 'always' },
  { status: 'UNVERIFIED_WITH_REASON', title: 'Unverified with reason', hint: 'Nothing mechanical settles these; the verifier must read them.', expand: 'always' },
  { status: 'OVERRIDDEN', title: 'Overrides', hint: 'Silenced by a proof:ignore marker with a reason.', expand: 'always' },
  { status: 'DECIDED', title: 'Decided', hint: 'Settled by a recorded decision.', expand: 'verbose' },
  { status: 'VERIFIED', title: 'Verified', hint: 'Every name in these checks out at the level shown.', expand: 'verbose' },
  { status: 'NOT_CHECKED', title: 'Not checked', hint: 'Outside the repository: system files and external tools.', expand: 'verbose' },
];

function spanLine(r: SpanResult): string {
  const ref = r.evidence[0];
  const where = ref && !r.reason.includes(ref.ref) ? ` (${ref.ref})` : '';
  const level = r.status === 'VERIFIED' || r.status === 'UNCONFIRMED' ? ` [${r.level}]` : '';
  const absent = r.expect === 'absent' ? ' [should be absent]' : '';
  const cwd = r.cwd ? ` [in ${r.cwd}/]` : '';
  return `  - ${MARK[r.status] ?? '?'}${level}${absent}${cwd} \`${clip(r.text, 100)}\` — ${r.reason}${where}`;
}

function agentLines(s: CheckedStatement): string[] {
  const a = s.agent;
  if (!a) return [];
  const head = `  - verifier${a.cached ? ' (cached)' : ''}: ${a.verdict.replace(/_/g, ' ')}${a.rejected ? ` — refused: ${a.rejected}` : a.reason ? ` — ${clip(a.reason, 220)}` : ''}`;
  const evidence = a.evidence.slice(0, 3).map((e) => `    - ${e.valid ? '✓' : '✗'} ${e.kind} \`${clip(e.ref, 100)}\`${e.excerpt ? ` "${clip(e.excerpt, 90)}"` : ''}${e.valid ? '' : ` — ${e.problem}`}`);
  const proposal = a.proposedText && s.status === 'STALE' ? [`  - proposed: ${clip(a.proposedText, 300)}`] : [];
  return [head, ...evidence, ...proposal];
}

function item(s: CheckedStatement, withSpans: boolean): string[] {
  const lines = [`- **L${s.line}** ${clip(s.text)}${s.section ? ` _(${s.section})_` : ''}`];
  if ((s.status === 'UNVERIFIED_WITH_REASON' || s.status === 'OVERRIDDEN') && !s.agent) lines.push(`  - ${s.reason}`);
  lines.push(...agentLines(s));
  if (withSpans) for (const r of s.results.filter((x) => x.kind !== 'prose')) lines.push(spanLine(r));
  return lines;
}

export function countsLine(r: FileReport): string {
  const c = r.counts;
  const parts = [
    `${c.STALE} stale`,
    c.FIXED ? `${c.FIXED} fixed` : '',
    c.FIX_REJECTED ? `${c.FIX_REJECTED} fix rejected` : '',
    `${c.UNCONFIRMED} unconfirmed`,
    `${c.UNVERIFIED_WITH_REASON} unverified`,
    c.OVERRIDDEN ? `${c.OVERRIDDEN} overridden` : '',
    c.DECIDED ? `${c.DECIDED} decided` : '',
    `${c.VERIFIED} verified`,
    `${c.NOT_CHECKED} not checked`,
  ];
  return parts.filter(Boolean).join(' · ');
}

/** Markdown for humans and agents. Spec 7.1. */
export function toMarkdown(r: FileReport, opts: { verbose?: boolean; mode?: 'check' | 'run' } = {}): string {
  const lines = [`# ${r.file}: ${r.verdict}`, ''];
  if (r.reason && !r.statements.length) {
    lines.push(r.reason, '', 'next:', `  Check the path, then re-run: proof check ${r.file}`);
    return `${lines.join('\n')}\n`;
  }
  if (r.reason) lines.push(`> ${r.reason}`, '');
  lines.push(countsLine(r), '');
  lines.push(`loaded: ${r.why}${r.scope === 'managed' || r.scope === 'user' ? ' (outside the repository: proof reports, never edits)' : ''}`);
  if (r.importedBy.length) lines.push(`imported by: ${r.importedBy.join(', ')}`);
  for (const i of r.imports) lines.push(`imports: @${i.path} (L${i.line}) — ${i.note || (i.followed ? 'checked' : 'not checked')}`);
  if (r.verdict !== r.ownVerdict) lines.push(`own statements: ${r.ownVerdict}; with what it imports: ${r.verdict}`);
  if (r.agent) {
    lines.push(`verifier: ${r.agent.answered}/${r.agent.sent} open statements answered${r.agent.cached ? ` (${r.agent.cached} cached)` : ''} · $${r.agent.costUsd.toFixed(2)} · ${r.agent.model}`);
    for (const f of r.agent.failures) lines.push(`verifier failed: ${f}`);
  }
  lines.push('');
  for (const d of r.degraded) lines.push(`degraded: ${d.subject} — ${d.reason}`);
  if (r.degraded.length) lines.push('');
  if (r.git) {
    lines.push(`branch \`${r.git.branch ?? 'detached'}\` · head \`${r.git.head?.slice(0, 12) ?? 'none'}\` · tree \`${r.git.tree.slice(0, 12)}\` · proof ${r.run.version}`, '');
    if (r.git.behind) lines.push(`> **This checkout is ${r.git.behind} commits behind ${r.git.upstream}.** The file and the code were read as checked out here; check the branch people actually work on.`, '');
  }
  const levels = Object.entries(r.evidenceLevels).filter(([, n]) => n > 0).map(([l, n]) => `${l} ${n}`).join(', ');
  if (levels) lines.push(`evidence: ${levels}`, '');
  for (const sec of SECTIONS) {
    const rows = r.statements.filter((s) => s.status === sec.status);
    if (!rows.length) continue;
    lines.push(`## ${sec.title} (${rows.length})`, '', sec.hint, '');
    if (sec.expand === 'verbose' && !opts.verbose) {
      lines.push(`(${rows.length} statement${rows.length === 1 ? '' : 's'}; --verbose lists them)`, '');
      continue;
    }
    for (const s of rows) lines.push(...item(s, sec.status !== 'NOT_CHECKED' || Boolean(opts.verbose)));
    lines.push('');
  }
  lines.push('next:', ...nextLines(r, opts.mode ?? 'check').map((l) => `  ${l}`));
  return `${lines.join('\n').trimEnd()}\n`;
}

/** Exact commands for what to do next. Spec 7.1, 7.3. */
export function nextLines(r: FileReport, mode: 'check' | 'run' = 'check'): string[] {
  const c = r.counts;
  const out: string[] = [];
  const open = c.UNCONFIRMED + c.UNVERIFIED_WITH_REASON;
  if (c.STALE) out.push(`Fix ${c.STALE} stale line${c.STALE === 1 ? '' : 's'}: edit ${r.file} by the reasons above${r.statements.some((s) => s.agent?.proposedText) ? ' and the proposed text' : ''}`);
  if (r.agent && r.agent.answered < r.agent.sent) out.push(`Finish verification: proof run ${r.file}${r.agent.failures.some((f) => f.includes('budget')) ? ' --budget-usd <more>' : ''}`);
  else if (open && mode === 'check') out.push(`Verify ${open} open statement${open === 1 ? '' : 's'} with the verifier agent: proof run ${r.file}`);
  else if (open) out.push(`Decide ${open} open statement${open === 1 ? '' : 's'}: each reason says what evidence is missing`);
  if (r.statements.some((s) => s.kind === 'marker')) out.push('Give each proof:ignore marker a reason: <!-- proof:ignore reason="…" -->');
  out.push(`Re-run: proof ${mode} ${r.file}`);
  return out;
}
