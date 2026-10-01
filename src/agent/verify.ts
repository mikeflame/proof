import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { workingTreeHash } from '../core/git.ts';
import type { RepoContext } from '../core/repo.ts';
import type { AgentVerdict, CheckedStatement } from '../model.ts';
import { type ClaudeResult, claudeVersion, runClaude } from './claude.ts';
import { type AgentEvidence, checkEvidence } from './evidence.ts';
import { ACTIONS, VERIFIER_RULES, VERIFIER_SCHEMA, VERIFIER_VERDICTS } from './rules.ts';

/** Bumped when the prompt or the rules change, so cached verdicts from older rules are not reused. */
export const PROMPT_VERSION = '3';

export interface VerifyOptions {
  model: string;
  /** Thinking effort for the verifier (low, medium, high, xhigh, max). */
  effort: string;
  /** Total spend for the run, across every call. */
  budgetUsd: number;
  /** Ceiling for one statement inside a call. */
  perStatementUsd: number;
  batchSize: number;
  jobs: number;
  cache: boolean;
  timeoutMs: number;
}

export const DEFAULT_VERIFY: VerifyOptions = { model: 'claude-sonnet-5-5', effort: 'high', budgetUsd: 10, perStatementUsd: 0.25, batchSize: 8, jobs: 2, cache: true, timeoutMs: 15 * 60_000 };

export interface AgentCoverage {
  /** Statements the mechanical stage left open and handed to the verifier. */
  sent: number;
  /** Statements that came back with a well-formed answer (cached ones included). */
  answered: number;
  cached: number;
  costUsd: number;
  model: string;
  /** Calls that failed, with why: these statements stay open and the file is untested. */
  failures: string[];
}

/** Open statements: everything the mechanical stage did not settle at definition or declaration level. */
export function needsAgent(st: CheckedStatement): boolean {
  if (st.kind === 'marker' || st.override?.reason) return false;
  if (st.status === 'VERIFIED') return !st.settled;
  return st.status === 'UNCONFIRMED' || st.status === 'UNVERIFIED_WITH_REASON' || st.status === 'STALE';
}

const TOOLS = ['Read', 'Grep', 'Glob', 'Bash'];
const ALLOWED = ['Read', 'Grep', 'Glob', 'Bash(git log:*)', 'Bash(git grep:*)', 'Bash(git ls-files:*)', 'Bash(git show:*)', 'Bash(git blame:*)', 'Bash(git rev-list:*)', 'Bash(ls:*)', 'Bash(wc:*)', 'Bash(find:*)', 'Bash(grep:*)', 'Bash(rg:*)', 'Bash(head:*)', 'Bash(cat:*)', 'Bash(sort:*)', 'Bash(uniq:*)', 'Bash(jq:*)'];

/** The prompt for one batch: the rules, then every statement with what the mechanical stage found. */
export function buildPrompt(file: string, why: string, batch: { key: string; st: CheckedStatement }[], note?: string): string {
  const items = batch.map(({ key, st }) => ({
    statement_id: key,
    line: st.line,
    section: st.section,
    text: st.text,
    mechanical: {
      status: st.status,
      reason: st.reason,
      still_open: st.residual,
      spans: st.results.filter((r) => r.kind !== 'prose').map((r) => ({ text: r.text, status: r.status, level: r.level, expect: r.expect, reason: r.reason, evidence: r.evidence.slice(0, 2).map((e) => e.ref) })),
    },
  }));
  return [
    `You verify statements from the instruction file ${file} (${why}) against the repository in your working directory.`,
    ...(note ? ['', note] : []),
    '',
    'Rules:',
    ...VERIFIER_RULES.map((r, i) => `${i + 1}. ${r}`),
    '',
    `Return exactly one result for each of the ${batch.length} statement ids below, in the structured output schema. Evidence kinds: file_line, command_output, count, git_log, absence. Excerpts at most 200 characters.`,
    '',
    '<statements>',
    JSON.stringify(items, null, 1),
    '</statements>',
  ].join('\n');
}

interface RawResult {
  statement_id?: unknown;
  verdict?: unknown;
  evidence?: unknown;
  reason?: unknown;
  proposed_text?: unknown;
  action?: unknown;
}

/** Validate one raw answer and its citations; a true or stale verdict needs at least one citation that checks out. */
export function judge(repo: RepoContext, raw: RawResult, model: string, cached = false): AgentVerdict | null {
  if (typeof raw.verdict !== 'string' || !(VERIFIER_VERDICTS as readonly string[]).includes(raw.verdict)) return null;
  const verdict = raw.verdict as AgentVerdict['verdict'];
  const action = typeof raw.action === 'string' && (ACTIONS as readonly string[]).includes(raw.action) ? (raw.action as AgentVerdict['action']) : 'needs-decision';
  const cited: AgentEvidence[] = Array.isArray(raw.evidence) ? raw.evidence.filter((e): e is AgentEvidence => Boolean(e) && typeof (e as AgentEvidence).ref === 'string' && typeof (e as AgentEvidence).kind === 'string') : [];
  const evidence = cited.slice(0, 6).map((e) => {
    const c = checkEvidence(repo, e);
    return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
  });
  const reason = typeof raw.reason === 'string' ? raw.reason.slice(0, 600) : '';
  const proposedText = typeof raw.proposed_text === 'string' && raw.proposed_text.trim() ? raw.proposed_text.trim() : null;
  let rejected: string | null = null;
  if (verdict !== 'unverified_with_reason' && !evidence.some((e) => e.valid)) {
    rejected = evidence.length ? `no citation checks out (${evidence.map((e) => `${e.ref}: ${e.problem}`).join('; ').slice(0, 300)})` : 'a verdict without evidence';
  }
  if (verdict === 'unverified_with_reason' && !reason) rejected = 'unverified without a reason';
  return { verdict, evidence, reason, proposedText, action, rejected, cached, model };
}

/**
 * The statement after the verifier: true with evidence verifies it, stale with evidence makes it stale, a
 * dispute with a mechanical stale line is a decision for a person, anything rejected stays open.
 */
export function applyVerdict(st: CheckedStatement, v: AgentVerdict): CheckedStatement {
  const out: CheckedStatement = { ...st, agent: v };
  if (v.rejected) return { ...out, status: st.status === 'STALE' ? 'STALE' : 'UNVERIFIED_WITH_REASON', reason: st.status === 'STALE' ? st.reason : `verifier answer refused: ${v.rejected}`, settled: false };
  if (v.verdict === 'true') {
    if (st.status === 'STALE') return { ...out, status: 'UNVERIFIED_WITH_REASON', reason: `the mechanical check says stale (${st.reason}); the verifier disputes it: ${v.reason || 'see evidence'}`, settled: false };
    return { ...out, status: 'VERIFIED', reason: v.reason || 'the verifier proved it', settled: true };
  }
  if (v.verdict === 'stale') return { ...out, status: 'STALE', reason: st.status === 'STALE' ? st.reason : v.reason || 'the verifier found it contradicted', settled: false };
  return { ...out, status: st.status === 'STALE' ? 'STALE' : 'UNVERIFIED_WITH_REASON', reason: st.status === 'STALE' ? st.reason : v.reason, settled: false };
}

const treeMemo = new WeakMap<object, Map<string, string>>();

/** The working tree without the instruction files and sidecars, hashed once per run: what verdicts are about. */
function codeTreeOf(repo: RepoContext, instructionFiles: string[]): string {
  if (!repo.isGit) return 'no-git';
  const excluded = [...new Set(instructionFiles.filter((f) => !f.startsWith('/')))].sort();
  const key = excluded.join('\0');
  const memo = treeMemo.get(repo) ?? new Map<string, string>();
  treeMemo.set(repo, memo);
  const known = memo.get(key);
  if (known) return known;
  const tree = workingTreeHash(repo.root, [...excluded, ':(glob)**/*.proof.json']);
  memo.set(key, tree);
  return tree;
}

type Cache = Record<string, { raw: RawResult; at: string }>;

function cacheDir(root: string): string {
  const base = process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache');
  return join(base, 'proof', createHash('sha1').update(root).digest('hex').slice(0, 16));
}

function loadCache(root: string): Cache {
  try {
    return JSON.parse(readFileSync(join(cacheDir(root), 'verdicts.json'), 'utf8')) as Cache;
  } catch {
    return {};
  }
}

function saveCache(root: string, cache: Cache): void {
  try {
    mkdirSync(cacheDir(root), { recursive: true });
    writeFileSync(join(cacheDir(root), 'verdicts.json'), JSON.stringify(cache));
  } catch {
    // a cache that cannot be written only costs a re-run
  }
}

export interface FileToVerify {
  file: string;
  why: string;
  statements: CheckedStatement[];
  /** Said to the verifier before the rules, for example that the text is a proposed edit not yet written. */
  note?: string;
}

/**
 * Hand every open statement of every file to the verifier, in batches, within the budget, and apply what
 * comes back. Returns the coverage of each file. Spec 3.4.
 */
export async function verifyFiles(repo: RepoContext, files: FileToVerify[], instructionFiles: string[], opts: VerifyOptions): Promise<Map<string, AgentCoverage>> {
  const coverage = new Map<string, AgentCoverage>();
  const version = claudeVersion();
  const codeTree = codeTreeOf(repo, instructionFiles);
  const cache = opts.cache ? loadCache(repo.root) : {};
  let spent = 0;

  type Job = { file: FileToVerify; batch: { key: string; st: CheckedStatement; index: number; cacheKey: string }[]; cov: AgentCoverage };
  const jobs: Job[] = [];
  for (const f of files) {
    const cov: AgentCoverage = { sent: 0, answered: 0, cached: 0, costUsd: 0, model: opts.model, failures: [] };
    coverage.set(f.file, cov);
    const open = f.statements.map((st, index) => ({ st, index })).filter(({ st }) => needsAgent(st));
    cov.sent = open.length;
    const fresh: { st: CheckedStatement; index: number; cacheKey: string }[] = [];
    for (const { st, index } of open) {
      const cacheKey = createHash('sha1').update([PROMPT_VERSION, opts.model, codeTree, f.file, st.id, st.status, st.reason, f.note ?? ''].join('\0')).digest('hex');
      const hit = cache[cacheKey];
      const v = hit ? judge(repo, hit.raw, opts.model, true) : null;
      if (v) {
        f.statements[index] = applyVerdict(st, v);
        cov.answered += 1;
        cov.cached += 1;
      } else fresh.push({ st, index, cacheKey });
    }
    if (fresh.length && !version) {
      cov.failures.push('the claude CLI does not run: install Claude Code, or set PROOF_CLAUDE to its path');
      continue;
    }
    for (let i = 0; i < fresh.length; i += opts.batchSize) {
      jobs.push({ file: f, cov, batch: fresh.slice(i, i + opts.batchSize).map((x, j) => ({ ...x, key: `s${i + j + 1}` })) });
    }
  }

  const runJob = async (job: Job, retry = false): Promise<void> => {
    const remaining = opts.budgetUsd - spent;
    const ceiling = Math.min(remaining, job.batch.length * opts.perStatementUsd);
    if (ceiling < 0.05) {
      job.cov.failures.push(`budget of $${opts.budgetUsd.toFixed(2)} spent before L${job.batch[0]?.st.line}–L${job.batch[job.batch.length - 1]?.st.line} were verified`);
      return;
    }
    const prompt = buildPrompt(job.file.file, job.file.why, job.batch, job.file.note);
    let result: ClaudeResult = await runClaude({ cwd: repo.root, prompt, schema: VERIFIER_SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: ceiling, tools: TOOLS, allowedTools: ALLOWED, timeoutMs: opts.timeoutMs });
    spent += result.costUsd;
    job.cov.costUsd += result.costUsd;
    // One retry for output that did not parse; a budget or timeout failure is final.
    if (!result.ok && (result.subtype === 'parse' || result.subtype === 'error_max_structured_output_retries')) {
      const again = Math.min(opts.budgetUsd - spent, ceiling);
      if (again >= 0.05) {
        result = await runClaude({ cwd: repo.root, prompt, schema: VERIFIER_SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: again, tools: TOOLS, allowedTools: ALLOWED, timeoutMs: opts.timeoutMs });
        spent += result.costUsd;
        job.cov.costUsd += result.costUsd;
      }
    }
    if (!result.ok) {
      job.cov.failures.push(`L${job.batch[0]?.st.line}–L${job.batch[job.batch.length - 1]?.st.line}: ${result.subtype}${result.error ? ` (${result.error})` : ''}`);
      return;
    }
    const answers = (result.structured as { results?: RawResult[] } | null)?.results ?? [];
    const missing: Job['batch'] = [];
    for (const item of job.batch) {
      const raw = answers.find((a) => a.statement_id === item.key);
      const v = raw ? judge(repo, raw, opts.model) : null;
      if (!v) {
        missing.push(item);
        continue;
      }
      job.file.statements[item.index] = applyVerdict(item.st, v);
      job.cov.answered += 1;
      if (raw && !v.rejected) cache[item.cacheKey] = { raw, at: new Date().toISOString() };
    }
    // Statements the verifier skipped or answered malformed get one more call of their own.
    if (missing.length && !retry) await runJob({ ...job, batch: missing }, true);
    else if (missing.length) job.cov.failures.push(`no well-formed verdict for ${missing.map((m) => `L${m.st.line}`).join(', ')}`);
  };

  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.max(1, opts.jobs) }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) await runJob(job);
    }),
  );
  if (opts.cache) saveCache(repo.root, cache);
  return coverage;
}
