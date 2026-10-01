import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { checkSpan, createContext, type SpanResult } from './check.ts';
import { branchInfo, gitState, type GitState } from './git.ts';
import { parseStatements, type Statement } from './parse.ts';
import { VERSION } from './version.ts';

/**
 * VERIFIED: every checkable part is backed by the repository.
 * STALE: at least one part is contradicted by the repository.
 * UNCONFIRMED: nothing contradicts it, but some part has no evidence.
 * UNCHECKED: nothing in it can be checked mechanically; it needs judgment.
 * SKIPPED: everything it names is outside the repository (system files, external tools).
 */
export type StatementStatus = 'VERIFIED' | 'STALE' | 'UNCONFIRMED' | 'UNCHECKED' | 'SKIPPED';

/**
 * PROVEN: everything checkable checked out and nothing needs judgment.
 * PARTLY PROVEN: nothing is stale, but some statements need judgment or have no evidence.
 * NOT PROVEN: at least one statement is stale.
 * UNTESTED: the file could not be read.
 */
export type Verdict = 'PROVEN' | 'PARTLY PROVEN' | 'NOT PROVEN' | 'UNTESTED';

export interface CheckedStatement extends Statement {
  status: StatementStatus;
  results: SpanResult[];
}

export interface Report {
  file: string;
  verdict: Verdict;
  reason?: string;
  counts: Record<StatementStatus, number>;
  git: (GitState & ReturnType<typeof branchInfo>) | null;
  createdAt: string;
  version: string;
  statements: CheckedStatement[];
}

export function statusOf(results: SpanResult[]): StatementStatus {
  const checked = results.filter((r) => r.status !== 'SKIPPED');
  if (checked.some((r) => r.status === 'STALE')) return 'STALE';
  if (!checked.length) return results.length ? 'SKIPPED' : 'UNCHECKED';
  if (checked.some((r) => r.status === 'UNCONFIRMED')) return 'UNCONFIRMED';
  return 'VERIFIED';
}

export function verdictOf(statements: CheckedStatement[]): Verdict {
  if (statements.some((s) => s.status === 'STALE')) return 'NOT PROVEN';
  if (statements.some((s) => s.status === 'UNCONFIRMED' || s.status === 'UNCHECKED')) return 'PARTLY PROVEN';
  // Nothing checked means nothing proven.
  return statements.some((s) => s.status === 'VERIFIED') ? 'PROVEN' : 'PARTLY PROVEN';
}

/** Check every statement of an instruction file against the repository it describes. */
export function proveFile(file: string, cwd: string): Report {
  const state = gitState(cwd);
  const root = state?.root ?? resolve(cwd);
  const abs = resolve(cwd, file);
  const rel = relative(root, abs) || file;
  const git = state ? { ...state, ...branchInfo(root) } : null;
  const counts: Record<StatementStatus, number> = { STALE: 0, UNCONFIRMED: 0, UNCHECKED: 0, VERIFIED: 0, SKIPPED: 0 };
  const base = { file: rel, counts, git, createdAt: new Date().toISOString(), version: VERSION };
  if (!existsSync(abs)) return { ...base, verdict: 'UNTESTED', reason: `${rel} does not exist`, statements: [] };

  const ctx = createContext(root, rel);
  const statements = parseStatements(readFileSync(abs, 'utf8')).map((s): CheckedStatement => {
    const results = s.spans.map((span) => checkSpan(ctx, span));
    return { ...s, results, status: statusOf(results) };
  });
  for (const s of statements) counts[s.status] += 1;
  return { ...base, verdict: verdictOf(statements), statements };
}

/** CLAUDE.md and AGENTS.md files in the repository, root first, ignored folders excluded. */
export function discover(cwd: string): string[] {
  const res = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*CLAUDE.md', '*AGENTS.md'], { cwd, encoding: 'utf8' });
  const found = res.status === 0 ? res.stdout.split('\n').filter(Boolean) : ['CLAUDE.md', 'AGENTS.md'].filter((f) => existsSync(resolve(cwd, f)));
  const sorted = [...new Set(found)].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
  // CLAUDE.md is often a symlink to AGENTS.md; check the file once.
  const seen = new Set<string>();
  return sorted.filter((f) => {
    const real = existsSync(resolve(cwd, f)) ? realpathSync(resolve(cwd, f)) : f;
    if (seen.has(real)) return false;
    seen.add(real);
    return true;
  });
}

const clip = (t: string, n = 160) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
const MARK: Record<string, string> = { VERIFIED: '✓', STALE: '✗', UNCONFIRMED: '?', SKIPPED: '·' };

export function toMarkdown(r: Report): string {
  const c = r.counts;
  const lines = [`# ${r.file}: ${r.verdict}`, ''];
  if (r.reason) return `${[...lines, r.reason].join('\n')}\n`;
  lines.push(`${c.STALE} stale · ${c.UNCONFIRMED} unconfirmed · ${c.UNCHECKED} need judgment · ${c.VERIFIED} verified · ${c.SKIPPED} not checked`, '');
  if (r.git) {
    lines.push(`branch \`${r.git.branch ?? 'detached'}\` · head \`${r.git.head?.slice(0, 12) ?? 'none'}\` · tree \`${r.git.tree.slice(0, 12)}\` · ${r.createdAt} · proof ${r.version}`, '');
    if (r.git.behind) lines.push(`> **This checkout is ${r.git.behind} commits behind ${r.git.upstream}.** The file and the code were read as they are here; check the branch people actually work on.`, '');
  }
  const block = (title: string, hint: string, status: StatementStatus, withEvidence: boolean) => {
    const rows = r.statements.filter((s) => s.status === status);
    if (!rows.length) return;
    lines.push(`## ${title} (${rows.length})`, '', hint, '');
    for (const s of rows) {
      lines.push(`- **L${s.line}** ${clip(s.text)}${s.section ? ` _(${s.section})_` : ''}`);
      if (!withEvidence) continue;
      for (const x of s.results.filter((y) => status === 'SKIPPED' || y.status !== 'SKIPPED')) lines.push(`  - ${MARK[x.status] ?? '?'} \`${x.text}\` — ${x.evidence}`);
    }
    lines.push('');
  };
  block('Stale', 'The repository contradicts these. Fix the line or the code.', 'STALE', true);
  block('Unconfirmed', 'Nothing contradicts these, but part of each has no evidence in code.', 'UNCONFIRMED', true);
  block('Needs judgment', 'Nothing here can be checked mechanically. Sort each into a rule (keep) or a fact (prove it with file:line).', 'UNCHECKED', false);
  block('Verified', 'The names in these exist. Re-read any that state status, counts or purpose.', 'VERIFIED', true);
  block('Not checked', 'Outside the repository: system files and external tools.', 'SKIPPED', true);
  return `${lines.join('\n').trimEnd()}\n`;
}
