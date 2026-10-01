import type { CheckedStatement, Span, SpanResult, Statement } from '../model.ts';
import { checkCommand, projectBinary } from './commands.ts';
import { checkDependency } from './deps.ts';
import { checkEnv } from './env.ts';
import { checkGlob, checkImport, checkLink, checkPath } from './paths.ts';
import { checkSymbol, textInCode } from './symbols.ts';
import { blocked, type CheckContext, notChecked, verified } from './util.ts';
import { checkVersion } from './versions.ts';

/** Every span gets a result; a check that throws reports not checked with the error, never vanishes. */
export async function checkSpan(ctx: CheckContext, span: Span): Promise<SpanResult> {
  try {
    switch (span.kind) {
      case 'path':
        return checkPath(ctx, span);
      case 'link':
        return checkLink(ctx, span);
      case 'import':
        return checkImport(ctx, span);
      case 'glob':
        return checkGlob(ctx, span);
      case 'command':
        return await checkCommand(ctx, span);
      case 'symbol':
        return await checkSymbol(ctx, span);
      case 'env':
        return checkEnv(ctx, span);
      case 'version':
        return checkVersion(ctx, span);
      case 'dependency':
        return checkDependency(ctx, span);
      case 'unknown':
        return await checkUnknown(ctx, span);
      case 'prose':
        return notChecked(span, 'nothing mechanical to check; the verifier reads it');
    }
  } catch (err) {
    return blocked(span, `check failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Untyped code: a command of a program this repository builds, or text that appears verbatim in code. */
async function checkUnknown(ctx: CheckContext, span: Span): Promise<SpanResult> {
  const first = span.text.split(/\s+/)[0] ?? '';
  if (projectBinary(ctx, first)) return checkCommand(ctx, { ...span, kind: 'command' });
  const text = span.text.trim();
  if (text.length >= 4 && !/^[\w-]+:$/.test(text)) {
    const found = await textInCode(ctx, text);
    if (found) return verified(span, 'reference', [found], `appears verbatim in code at ${found.ref}`);
  }
  return blocked(span, 'not a path, command, name or version this tool can check');
}

const TYPED = (r: SpanResult) => r.kind !== 'prose';

/** Statement status from its span results and residual claims. Spec 4.1; fail closed (D4). */
export function aggregate(st: Statement, results: SpanResult[]): CheckedStatement {
  const base = { ...st, results };
  if (st.kind === 'marker') return { ...base, status: 'UNVERIFIED_WITH_REASON', reason: 'an ignore marker needs reason="…"; without one it silences nothing', settled: false };
  const typed = results.filter(TYPED);
  const checked = typed.filter((r) => r.status !== 'NOT_CHECKED');
  const firstStale = typed.find((r) => r.status === 'STALE');
  const firstUnconfirmed = typed.find((r) => r.status === 'UNCONFIRMED');
  const firstBlocked = typed.find((r) => r.blocked);
  let out: CheckedStatement;
  if (firstStale) out = { ...base, status: 'STALE', reason: `\`${firstStale.text}\`: ${firstStale.reason}`, settled: false };
  else if (firstUnconfirmed) out = { ...base, status: 'UNCONFIRMED', reason: `\`${firstUnconfirmed.text}\`: ${firstUnconfirmed.reason}`, settled: false };
  else if (firstBlocked) out = { ...base, status: 'UNVERIFIED_WITH_REASON', reason: `could not check \`${firstBlocked.text}\`: ${firstBlocked.reason}`, settled: false };
  else if (checked.length && checked.every((r) => r.status === 'VERIFIED')) {
    if (st.residual.length) out = { ...base, status: 'UNVERIFIED_WITH_REASON', reason: `names verified; still to check: ${st.residual.join(', ')}`, settled: false };
    else out = { ...base, status: 'VERIFIED', reason: 'every name in it checks out', settled: checked.every((r) => r.level === 'definition' || r.level === 'declaration') };
  } else if (typed.length && !checked.length && !st.residual.length) out = { ...base, status: 'NOT_CHECKED', reason: typed[0]?.reason ?? 'outside the repository', settled: false };
  else out = { ...base, status: 'UNVERIFIED_WITH_REASON', reason: st.residual.length ? `nothing mechanical settles it: ${st.residual.join(', ')}` : 'nothing mechanical to check; the verifier reads it', settled: false };
  if (st.override?.reason) return { ...out, status: 'OVERRIDDEN', reason: `overridden: ${st.override.reason} (was ${out.status.toLowerCase().replace(/_/g, ' ')}: ${out.reason})` };
  return out;
}

/**
 * Sub-projects the statement itself points at: "after changing `frontend/shared/` run `yarn cp`" runs in
 * `frontend/`. Commands without a `cd` also try these folders.
 */
function mentionedProjects(ctx: CheckContext, st: Statement): string[] {
  const projects = ctx.repo.projectDirs;
  const out = new Set<string>();
  for (const s of st.spans) {
    if (s.kind !== 'path' && s.kind !== 'link') continue;
    const p = ctx.repo.rel(s.text.replace(/\/$/, ''), ctx.docDir);
    if (!p) continue;
    const owner = projects.filter((d) => p === d || p.startsWith(`${d}/`)).sort((a, b) => b.length - a.length)[0];
    if (owner) out.add(owner);
  }
  return [...out];
}

export async function checkStatement(ctx: CheckContext, st: Statement): Promise<CheckedStatement> {
  const projects = mentionedProjects(ctx, st);
  const withHints = projects.length ? st.spans.map((s) => (s.kind === 'command' && s.cwd === undefined ? { ...s, hintDirs: [...(s.hintDirs ?? []), ...projects.map((d) => (ctx.docDir && d.startsWith(`${ctx.docDir}/`) ? d.slice(ctx.docDir.length + 1) : d))] } : s)) : st.spans;
  const spans: Span[] = withHints.length ? withHints : [{ kind: 'prose', text: '(statement)', expect: 'present' }];
  const results: SpanResult[] = [];
  for (const span of spans) results.push(await checkSpan(ctx, span));
  return aggregate(st, results);
}
