import { spawnSync } from 'node:child_process';
import type { RepoContext } from '../core/repo.ts';
import type { EvidenceLevel } from '../model.ts';
import { splitShell } from '../parse/shell.ts';

export interface AgentEvidence {
  kind: string;
  ref: string;
  excerpt?: string | undefined;
}

export interface CheckedEvidence extends AgentEvidence {
  valid: boolean;
  /** Why it does not check out; empty when valid. */
  problem: string;
  level: EvidenceLevel;
}

/** Commands proof re-runs to check a citation: read-only, no redirection, no substitution. */
const READ_ONLY: Record<string, (argv: string[]) => boolean> = {
  git: (a) => ['log', 'grep', 'ls-files', 'show', 'blame', 'rev-list', 'shortlog', 'ls-tree', 'cat-file', 'describe', 'rev-parse', 'tag', 'branch'].includes(a[1] ?? '') && !a.some((x) => /^--(output|exec)/.test(x)) && !(a[1] === 'branch' && a.some((x) => /^-[dDmMcC]$/.test(x))) && !(a[1] === 'tag' && a.some((x) => /^-[ad]$/.test(x))),
  ls: () => true,
  wc: () => true,
  grep: () => true,
  rg: (a) => !a.some((x) => x.startsWith('--pre')),
  find: (a) => !a.some((x) => ['-exec', '-execdir', '-delete', '-ok', '-okdir', '-fprint', '-fprintf', '-fls'].includes(x)),
  cat: () => true,
  head: () => true,
  tail: () => true,
  sort: (a) => !a.some((x) => x === '-o' || x.startsWith('--output')),
  uniq: (a) => a.filter((x) => !x.startsWith('-')).length <= 2,
  cut: () => true,
  jq: () => true,
  tr: () => true,
  awk: (a) => !a.some((x) => /system|>|getline/.test(x)),
};

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Why `ref` is not a command proof may re-run, or null when it is. */
export function unsafeCommand(ref: string): string | null {
  if (/[;&<>`]|\$\(|\|\|/.test(ref.replace(/'[^']*'|"[^"]*"/g, '""'))) return 'uses redirection, substitution or chaining';
  const commands = splitShell(ref);
  if (!commands.length) return 'empty command';
  for (const c of commands) {
    const bin = c.argv[0] ?? '';
    const ok = READ_ONLY[bin];
    if (!ok) return `\`${bin}\` is not a read-only command proof re-runs`;
    if (!ok(c.argv)) return `\`${c.argv.join(' ')}\` could write`;
    if (Object.keys(c.env).length) return 'sets environment variables';
  }
  return null;
}

function rerun(root: string, ref: string): { out: string; error: string | null } {
  const res = spawnSync('bash', ['-c', ref], { cwd: root, encoding: 'utf8', timeout: 20_000, maxBuffer: 16 * 1024 * 1024, env: { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: process.env.HOME ?? '/', LANG: 'C', GIT_PAGER: 'cat', PAGER: 'cat' } });
  if (res.error) return { out: '', error: res.error.message };
  // grep and git grep exit 1 on no match, which is an answer, not a failure.
  if (res.status !== 0 && res.status !== 1) return { out: res.stdout, error: (res.stderr || `exit ${res.status}`).split('\n')[0] ?? 'failed' };
  return { out: res.stdout, error: null };
}

/**
 * Check one citation the verifier gave, the way a reviewer would: the file and line exist and say what
 * the excerpt says; a command re-runs read-only and prints the excerpt (an absence prints nothing).
 * Confidence is not evidence (D3); a citation that does not check out does not count.
 */
export function checkEvidence(repo: RepoContext, e: AgentEvidence): CheckedEvidence {
  const bad = (problem: string): CheckedEvidence => ({ ...e, valid: false, problem, level: 'none' });
  if (e.kind === 'file_line') {
    const m = /^(.+?):(\d+)(?:-(\d+))?$/.exec(e.ref.trim());
    if (!m) return bad('ref is not path:line');
    const file = (m[1] ?? '').replace(/^\.\//, '');
    const rel = repo.rel(file);
    if (rel === null) return bad('points outside the repository');
    const text = repo.read(rel);
    if (text === null) return bad(`${file} does not exist`);
    const lines = text.split('\n');
    const from = Number(m[2]);
    const to = Number(m[3] ?? m[2]);
    if (from < 1 || to < from || from > lines.length) return bad(`${file} has ${lines.length} lines`);
    if (e.excerpt) {
      const window = normalize(lines.slice(Math.max(0, from - 4), Math.min(lines.length, to + 3)).join('\n'));
      const want = normalize(e.excerpt).replace(/…$/, '');
      if (want && !window.includes(want)) return bad(`the excerpt is not at ${file}:${from}`);
    }
    return { ...e, valid: true, problem: '', level: 'definition' };
  }
  if (e.kind === 'command_output' || e.kind === 'count' || e.kind === 'git_log' || e.kind === 'absence') {
    const unsafe = unsafeCommand(e.ref);
    if (unsafe) return bad(`not re-run: ${unsafe}`);
    const { out, error } = rerun(repo.root, e.ref);
    if (error) return bad(`re-run failed: ${error}`);
    if (e.kind === 'absence') return out.trim() ? bad(`the search prints ${out.trim().split('\n').length} line(s), so the thing is not absent`) : { ...e, valid: true, problem: '', level: 'definition' };
    const want = normalize(e.excerpt ?? '');
    if (!want) return bad('a command citation needs an excerpt of its output');
    if (!normalize(out).includes(want)) return bad('the re-run output does not contain the excerpt');
    return { ...e, valid: true, problem: '', level: 'declaration' };
  }
  return bad(`unknown evidence kind ${e.kind}`);
}
