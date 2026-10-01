import { spawnSync } from 'node:child_process';
import type { CheckedStatement, Span, SpanResult, Statement } from '../model.ts';
import { checkCommand, projectBinary } from './commands.ts';
import { checkDependency } from './deps.ts';
import { checkEnv } from './env.ts';
import { checkGlob, checkImport, checkLink, checkPath, NO_MATCH } from './paths.ts';
import { checkSymbol, LookupError, textInCode } from './symbols.ts';
import { blocked, type CheckContext, notChecked, unconfirmed, verified } from './util.ts';
import { checkVersion } from './versions.ts';

/** Remote URLs as `host/owner/repo`, so `git@github.com:a/b.git` and `https://github.com/a/b` compare equal. */
const normalizeRemote = (url: string) => url.trim().replace(/^[a-z+]+:\/\//, '').replace(/^[^@/]+@/, '').replace(/:(?!\d)/, '/').replace(/\.git$/, '').replace(/\/$/, '').toLowerCase();

const remotes = new WeakMap<object, string[]>();

/** Whether `url` is a remote of this repository: then a fresh clone of it is this repository. */
function isThisRepository(ctx: CheckContext, url: string): boolean {
  let known = remotes.get(ctx.repo);
  if (!known) {
    const res = spawnSync('git', ['remote', '-v'], { cwd: ctx.repo.root, encoding: 'utf8' });
    known = res.status === 0 ? [...new Set(res.stdout.split('\n').map((l) => l.split(/\s+/)[1] ?? '').filter(Boolean).map(normalizeRemote))] : [];
    remotes.set(ctx.repo, known);
  }
  return known.includes(normalizeRemote(url));
}

/** Every span gets a result; a check that throws reports not checked with the error, never vanishes. */
export async function checkSpan(ctx: CheckContext, original: Span): Promise<SpanResult> {
  let span = original;
  if (span.clone) {
    if (!isThisRepository(ctx, span.clone.url)) return notChecked(span, `runs in a fresh clone of ${span.clone.url}, not in this repository`);
    // A fresh clone of this repository: `proof/plugins/x` is `plugins/x` here.
    const dir = span.clone.dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    span = { ...span, text: span.text.replace(new RegExp(`(^|[\\s=])${dir}/`, 'g'), '$1') };
  }
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
    if (err instanceof LookupError) return blocked(span, `lookup failed: ${err.message}`);
    return blocked(span, `check failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Untyped code: a command of a program this repository builds, or text that appears verbatim in code. */
async function checkUnknown(ctx: CheckContext, span: Span): Promise<SpanResult> {
  const first = span.text.split(/\s+/)[0] ?? '';
  if (projectBinary(ctx, first)) return checkCommand(ctx, { ...span, kind: 'command' });
  const text = span.text.trim();
  if (text.length >= 4 && !/^[\w-]+:$/.test(text)) {
    // Verbatim in code, the snippet exists; what it illustrates ("catch this") is for the verifier.
    const found = await textInCode(ctx, text);
    if (found) return { ...unconfirmed(span, `appears verbatim in code at ${found.ref}; what the example illustrates is not checked`, [found], 'reference'), status: 'NOT_CHECKED', blocked: true };
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
    const p = ctx.repo.rel(s.text.replace(/\/$/, ''), ctx.pathBase);
    if (!p) continue;
    const owner = projects.filter((d) => p === d || p.startsWith(`${d}/`)).sort((a, b) => b.length - a.length)[0];
    if (owner) out.add(owner);
  }
  return [...out];
}

const MEMBER_WORDS = /\b(?:with|has|have|having|contains?|exposes?|provides?|includes?|fields?|propert(?:y|ies)|methods?|members?|keys?)\b/i;
const TYPE_NAME = /^[A-Z][A-Za-z0-9]*$/;
const MEMBER_NAME = /^[a-z_$][\w$]*(\(\))?$/;

/**
 * Spans the statement implies but does not spell out: `.resource()` after `McpServer.tool()` is
 * `McpServer.resource()`, and in "`BaseContext` with `signal`, `sessionId`" each name is a member claim,
 * checked as `BaseContext.signal`.
 */
export function impliedSpans(st: Statement): Span[] {
  const spans = st.spans.map((s): Span => {
    const fragment = s.kind === 'unknown' ? /^\.([A-Za-z_$][\w$]*(?:\(\))?)$/.exec(s.text) : null;
    if (!fragment) return s;
    const owner = [...st.spans].reverse().find((o) => o.kind === 'symbol' && /^[A-Z][\w$]*\.[\w$]+/.test(o.text) && st.text.indexOf(o.text) < st.text.indexOf(s.text));
    return owner ? { ...s, kind: 'symbol', text: `${owner.text.split('.')[0]}.${fragment[1]}` } : s;
  });
  const type = spans.find((s) => s.kind === 'symbol' && TYPE_NAME.test(s.text));
  if (!type) return spans;
  const after = st.text.slice(st.text.indexOf(`\`${type.text}\``) + type.text.length + 2);
  const cue = MEMBER_WORDS.exec(after);
  if (!cue || cue.index > 12) return spans;
  return spans.map((s) => (s !== type && s.kind === 'symbol' && MEMBER_NAME.test(s.text) && after.includes(`\`${s.text}\``) ? { ...s, text: `${type.text}.${s.text}` } : s));
}

export async function checkStatement(ctx: CheckContext, st: Statement): Promise<CheckedStatement> {
  const projects = mentionedProjects(ctx, st);
  const implied = impliedSpans(st);
  const withHints = projects.length ? implied.map((s) => (s.kind === 'command' && s.cwd === undefined ? { ...s, hintDirs: [...(s.hintDirs ?? []), ...projects.map((d) => (ctx.pathBase && d.startsWith(`${ctx.pathBase}/`) ? d.slice(ctx.pathBase.length + 1) : d))] } : s)) : implied;
  const spans: Span[] = withHints.length ? withHints : [{ kind: 'prose', text: '(statement)', expect: 'present' }];
  const results: SpanResult[] = [];
  for (const span of spans) results.push(await checkSpan(ctx, span));
  // A rule still loads through its other patterns: one that matches nothing today is unconfirmed, not stale.
  if (st.kind === 'frontmatter' && results.some((r) => r.kind === 'glob' && r.status === 'VERIFIED')) {
    for (const [i, r] of results.entries()) if (r.kind === 'glob' && r.status === 'STALE' && r.reason.startsWith(NO_MATCH)) results[i] = { ...r, status: 'UNCONFIRMED', reason: `${r.reason}; the rule's other patterns still load it` };
  }
  return aggregate(st, results);
}
