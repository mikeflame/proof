import type { CheckedStatement, SpanResult } from './model.ts';
import type { FileReport } from './pipeline.ts';
import { STATUSES } from './vocabulary.ts';

const MARK: Record<string, string> = { VERIFIED: '✓', STALE: '✗', UNCONFIRMED: '?', NOT_CHECKED: '·' };
const oneLine = (raw: string) => raw.replace(/\s+/g, ' ').trim();
const clip = (raw: string, n = 160) => {
  const t = oneLine(raw);
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Report sections in the order of spec 7.1, from the shared vocabulary. */
export const SECTIONS = STATUSES.map((s) => ({ status: s.status, title: s.title, hint: s.meaning, expand: s.expand }));

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
  const head = `  - verifier${a.cached ? ' (cached)' : ''}: ${a.verdict.replace(/_/g, ' ')}${a.rejected ? ` — refused: ${a.rejected}` : a.reason ? ` — ${oneLine(a.reason)}` : ''}`;
  const evidence = a.evidence.slice(0, 3).map((e) => `    - ${e.valid ? '✓' : '✗'} ${e.kind} \`${clip(e.ref, 100)}\`${e.excerpt ? ` "${clip(e.excerpt, 90)}"` : ''}${e.valid ? '' : ` — ${e.problem}`}`);
  const proposal = a.proposedText && s.status === 'STALE' ? [`  - proposed: ${oneLine(a.proposedText)}`] : [];
  return [head, ...evidence, ...proposal];
}

function fixLines(s: CheckedStatement): string[] {
  const f = s.fix;
  if (!f) return [];
  const id = s.id.slice(0, 10);
  if (f.outcome === 'applied') return [`  - fixed (tier ${f.tier}, id ${id})${s.status === 'FIXED' ? '' : '; what it changed is proven, the rest is still open'}: was "${clip(f.was ?? f.old, 200)}"`, ...f.evidence.filter((e) => e.valid).slice(0, 2).map((e) => `    - ✓ ${e.kind} \`${clip(e.ref, 100)}\`${e.excerpt ? ` "${clip(e.excerpt, 90)}"` : ''}`)];
  const proposal = f.action === 'delete' ? 'delete the statement' : `"${clip(f.old, 120)}" → "${oneLine(f.new)}"`;
  if (f.outcome === 'rejected') return [`  - fix rejected and reverted (tier ${f.tier}): ${proposal}`, `    - re-verifier: ${oneLine(f.reverify)}`];
  if (f.outcome === 'refused') return [`  - fix not applied: ${f.reverify}`, `    - proposed: ${proposal}`];
  return [`  - would fix (tier ${f.tier}): ${proposal}`, `    - re-verifier: ${oneLine(f.reverify)}`];
}

function item(s: CheckedStatement, withSpans: boolean): string[] {
  const lines = [`- **L${s.line}** ${clip(s.text)}${s.section ? ` _(${s.section})_` : ''}`];
  if ((s.status === 'UNVERIFIED_WITH_REASON' || s.status === 'OVERRIDDEN' || s.status === 'DECIDED') && !s.agent) lines.push(`  - ${s.reason}`);
  lines.push(...fixLines(s));
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
    lines.push(`verifier: ${r.agent.answered}/${r.agent.sent} open statements answered${r.agent.cached ? ` (${r.agent.cached} cached)` : ''} · ${r.agent.model}${r.run.budgetUsedUsd !== undefined ? ` · run spent $${r.run.budgetUsedUsd.toFixed(2)}` : ''}`);
    for (const f of r.agent.failures) lines.push(`verifier failed: ${f}`);
  }
  lines.push('');
  for (const d of r.degraded) lines.push(`degraded: ${d.subject} — ${d.reason}`);
  if (r.degraded.length) lines.push('');
  for (const d of r.reopened) lines.push(`reopened: the ${d.kind} decision on "${clip(d.text, 120)}" (by ${d.by}) no longer matches a line; the edited line is open again`);
  if (r.reopened.length) lines.push('');
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
  const deleted = (r.fixes ?? []).filter((f) => f.action === 'delete' && f.outcome === 'applied');
  if (deleted.length) lines.push(`## Deleted (${deleted.length})`, '', 'Removed with evidence that the thing is gone.', '', ...deleted.map((f) => `- **L${f.line}** ${clip(f.old)}`), '');
  if (r.gaps?.length) lines.push('## Gap proposals (not applied)', '', 'Asked for with --gaps. Each cites its evidence; add one by hand if you want it.', '', ...r.gaps.flatMap((g) => [`- ${g.section ? `_${g.section}_: ` : ''}${clip(g.text, 200)}`, ...g.evidence.filter((e) => e.valid).slice(0, 2).map((e) => `  - ✓ ${e.kind} \`${clip(e.ref, 100)}\`${e.excerpt ? ` "${clip(e.excerpt, 90)}"` : ''}`)]), '');
  if (r.diff) lines.push(`## Diff${r.fixes?.some((f) => f.outcome === 'dry-run') ? ' (dry run: not written)' : ''}`, '', '```diff', r.diff.trimEnd(), '```', '');
  lines.push('next:', ...nextLines(r, opts.mode ?? 'check').map((l) => `  ${l}`));
  return `${lines.join('\n').trimEnd()}\n`;
}

/** Exact commands for what to do next. Spec 7.1, 7.3. */
export function nextLines(r: FileReport, mode: 'check' | 'run' = 'check'): string[] {
  const c = r.counts;
  const out: string[] = [];
  const open = c.UNCONFIRMED + c.UNVERIFIED_WITH_REASON;
  const applied = (r.fixes ?? []).filter((f) => f.outcome === 'applied');
  if (applied.length) {
    out.push(`Review the diff: git diff -- ${r.file}`);
    out.push(`Revert one fix: proof revert ${r.file} --id <id shown on the fixed line>`);
  }
  if ((r.fixes ?? []).some((f) => f.outcome === 'dry-run')) out.push(`Apply the fixes: proof run ${r.file}`);
  if (c.STALE && mode === 'check') out.push(`Fix ${c.STALE} stale line${c.STALE === 1 ? '' : 's'}: proof run ${r.file}, or edit ${r.file} by the reasons above`);
  else if (c.STALE) out.push(`Fix ${c.STALE} stale line${c.STALE === 1 ? '' : 's'} by hand: ${r.file}, by the reasons and the refused proposals above`);
  if (c.FIX_REJECTED) out.push(`${c.FIX_REJECTED} fix${c.FIX_REJECTED === 1 ? ' was' : 'es were'} rejected by the re-verifier: correct ${c.FIX_REJECTED === 1 ? 'that line' : 'those lines'} by hand`);
  if (r.agent && r.agent.answered < r.agent.sent) out.push(`Finish verification: proof run ${r.file}${r.agent.failures.some((f) => f.includes('budget')) ? ' --budget-usd <more>' : ''}`);
  else if (open && mode === 'check') out.push(`Verify ${open} open statement${open === 1 ? '' : 's'} with the verifier agent: proof run ${r.file}`);
  else if (open) out.push(`Decide ${open} open item${open === 1 ? '' : 's'}: proof decide ${r.file}`);
  if (r.statements.some((s) => s.kind === 'marker')) out.push('Give each proof:ignore marker a reason: <!-- proof:ignore reason="…" -->');
  out.push(`Re-run: proof ${mode} ${r.file}`);
  return out;
}
