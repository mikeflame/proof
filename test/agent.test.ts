// The agent stage (spec 3.4, 4.4), driven through the bundle with a fake claude CLI.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkEvidence, unsafeCommand } from '../src/agent/evidence.ts';
import { RepoContext } from '../src/core/repo.ts';
import type { FileReport } from '../src/pipeline.ts';
import { type Fixture, makeRepo } from './fixtures/edge.ts';

const BUNDLE = join(import.meta.dirname, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');
const FAKE = join(import.meta.dirname, 'fixtures', 'fake-claude.mjs');

let work: string;
beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), 'proof-agent-'));
});
afterEach(() => rmSync(work, { recursive: true, force: true }));

interface Plan {
  mode?: 'garbage' | 'crash' | 'budget';
  cost?: number;
  answers?: ({ match: string; omit?: boolean } & Record<string, unknown>)[];
}

function proofRun(repo: string, plan: Plan, ...args: string[]): { status: number | null; report: FileReport; calls: { args: string[]; prompt: string }[] } {
  const planFile = join(work, 'plan.json');
  const log = join(work, 'calls.jsonl');
  writeFileSync(planFile, JSON.stringify(plan));
  const res = spawnSync(process.execPath, [BUNDLE, 'run', 'CLAUDE.md', '--json', ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, PROOF_CLAUDE: FAKE, FAKE_CLAUDE_PLAN: planFile, FAKE_CLAUDE_LOG: log, XDG_CACHE_HOME: join(work, 'cache') },
  });
  const reports = JSON.parse(res.stdout || '[]') as FileReport[];
  if (!reports[0]) throw new Error(res.stderr);
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as { args: string[]; prompt: string }) : [];
  return { status: res.status, report: reports[0], calls };
}

const st = (r: FileReport, part: string) => {
  const s = r.statements.find((x) => x.text.includes(part));
  if (!s) throw new Error(`no statement with ${part}`);
  return s;
};

const DOC = '# App\n\n- The API has 2 handlers in `src/handlers/`.\n- Lint forbids default exports.\n';
const FILES = { 'CLAUDE.md': DOC, 'src/handlers/a.ts': 'export function a() {}\n', 'src/handlers/b.ts': 'export function b() {}\n', '.eslintrc.json': '{ "rules": { "import/no-default-export": "error" } }\n' };

describe('verifier answers', () => {
  let f: Fixture;
  beforeEach(() => {
    f = makeRepo(FILES);
  });
  afterEach(() => f.cleanup());

  it('verifies a statement whose citations check out, and runs the verifier read-only without the file under test', () => {
    const { report, calls, status } = proofRun(f.repo, {
      answers: [
        { match: '2 handlers', verdict: 'true', reason: 'two files', evidence: [{ kind: 'count', ref: 'git ls-files src/handlers | wc -l', excerpt: '2' }] },
        { match: 'Lint forbids', verdict: 'true', reason: 'eslint rule', evidence: [{ kind: 'file_line', ref: '.eslintrc.json:1', excerpt: '"import/no-default-export": "error"' }] },
      ],
    });
    expect(st(report, '2 handlers')).toMatchObject({ status: 'VERIFIED', agent: { verdict: 'true', rejected: null } });
    expect(st(report, 'Lint forbids').status).toBe('VERIFIED');
    expect(report.agent).toMatchObject({ sent: 2, answered: 2, failures: [] });
    expect(report.verdict).toBe('PROVEN');
    expect(status).toBe(0);
    const args = calls[0]?.args ?? [];
    expect(args[args.indexOf('--setting-sources') + 1]).toBe('user');
    expect(args[args.indexOf('--tools') + 1]).not.toMatch(/Edit|Write/);
    expect(args[args.indexOf('--disallowedTools') + 1]).toContain('Edit');
    expect(calls[0]?.prompt).toContain('Your confidence is not evidence');
  });

  it('refuses a verdict whose citation does not check out, or that has none', () => {
    const { report } = proofRun(f.repo, {
      answers: [
        { match: '2 handlers', verdict: 'true', evidence: [{ kind: 'file_line', ref: 'src/handlers/a.ts:1', excerpt: 'export function zzz' }] },
        { match: 'Lint forbids', verdict: 'true', evidence: [] },
      ],
    });
    expect(st(report, '2 handlers')).toMatchObject({ status: 'UNVERIFIED_WITH_REASON' });
    expect(st(report, '2 handlers').agent?.rejected).toContain('excerpt is not at');
    expect(st(report, 'Lint forbids').agent?.rejected).toBe('a verdict without evidence');
  });

  it('keeps a true verdict open when its own reason says the claim is not shown', () => {
    const { report } = proofRun(f.repo, {
      answers: [{ match: 'Lint forbids', verdict: 'true', reason: 'The rule exists, but whether CI runs lint is not shown here.', evidence: [{ kind: 'file_line', ref: '.eslintrc.json:1', excerpt: '"import/no-default-export": "error"' }] }],
    });
    expect(st(report, 'Lint forbids')).toMatchObject({ status: 'UNVERIFIED_WITH_REASON', agent: { verdict: 'unverified_with_reason', rejected: null } });
    expect(st(report, 'Lint forbids').reason).toContain('is not shown here');
  });

  it('marks a contradicted statement stale and carries the proposed text', () => {
    const { report, status } = proofRun(f.repo, {
      answers: [{ match: '2 handlers', verdict: 'stale', reason: 'there are 2 files but the doc', proposed_text: 'The API has 2 handlers.', action: 'fix-with-evidence', evidence: [{ kind: 'absence', ref: 'git ls-files src/api' }] }],
    });
    expect(st(report, '2 handlers')).toMatchObject({ status: 'STALE', agent: { proposedText: 'The API has 2 handlers.' } });
    expect(status).toBe(1);
  });

  it('never re-runs a command that could write', () => {
    const { report } = proofRun(f.repo, { answers: [{ match: '2 handlers', verdict: 'true', evidence: [{ kind: 'command_output', ref: 'echo 2 > pwned.txt', excerpt: '2' }] }] });
    expect(existsSync(join(f.repo, 'pwned.txt'))).toBe(false);
    expect(st(report, '2 handlers').agent?.evidence[0]?.problem).toContain('not re-run');
  });
});

describe('a mechanical stale line the verifier disputes', () => {
  it('goes to a person instead of either side winning', () => {
    const f = makeRepo({ 'CLAUDE.md': '- Entry: `src/main.ts`.\n', 'src/other.ts': 'export {};\n' });
    try {
      const { report } = proofRun(f.repo, { answers: [{ match: 'Entry', verdict: 'true', reason: 'it is other.ts', evidence: [{ kind: 'file_line', ref: 'src/other.ts:1', excerpt: 'export {};' }] }] });
      expect(st(report, 'Entry').status).toBe('UNVERIFIED_WITH_REASON');
      expect(st(report, 'Entry').reason).toContain('disputes');
    } finally {
      f.cleanup();
    }
  });
});

describe('coverage and failures', () => {
  let f: Fixture;
  beforeEach(() => {
    f = makeRepo(FILES);
  });
  afterEach(() => f.cleanup());

  it('asks again for a statement the verifier skipped, then reports the file untested', () => {
    const { report, calls, status } = proofRun(f.repo, { answers: [{ match: '2 handlers', omit: true }] });
    expect(calls.length).toBe(2);
    expect(report.agent).toMatchObject({ sent: 2, answered: 1 });
    expect(report.verdict).toBe('UNTESTED');
    expect(status).toBe(2);
  });

  it('keeps statements open and the file untested when the budget runs out or the CLI fails', () => {
    for (const mode of ['budget', 'crash', 'garbage'] as const) {
      const { report, status } = proofRun(f.repo, { mode });
      expect(report.agent?.answered, mode).toBe(0);
      expect(report.agent?.failures.length, mode).toBeGreaterThan(0);
      expect(report.verdict, mode).toBe('UNTESTED');
      expect(status, mode).toBe(2);
    }
  });

  it('treats an empty PROOF_CLAUDE as unset', () => {
    f = makeRepo({ 'CLAUDE.md': '# App\n\n- Keep it simple.\n' });
    const res = spawnSync(process.execPath, [BUNDLE, 'run', 'CLAUDE.md', '--no-fix'], { cwd: f.repo, encoding: 'utf8', env: { ...process.env, PROOF_CLAUDE: '', PATH: '/usr/bin:/bin', XDG_CACHE_HOME: join(work, 'cache') } });
    expect(res.stderr).not.toContain('ERR_INVALID_ARG_VALUE');
    expect(res.stdout).toContain('the claude CLI does not run');
  });

  it('stops calling once the run budget is spent', () => {
    const doc = Array.from({ length: 20 }, (_, i) => `- Statement number ${i} is about handlers here.`).join('\n');
    writeFileSync(join(f.repo, 'CLAUDE.md'), `# Many\n\n${doc}\n`);
    const { report, calls } = proofRun(f.repo, { cost: 0.4 }, '--budget-usd', '0.5', '--jobs', '1', '--batch-size', '5');
    expect(calls.length).toBeLessThan(4);
    expect(report.agent?.failures.join(' ')).toContain('budget');
    expect(report.verdict).toBe('UNTESTED');
  });
});

describe('cache', () => {
  it('reuses verdicts while the code is unchanged, and asks again when it changes', () => {
    const f = makeRepo(FILES);
    try {
      const plan: Plan = { answers: [{ match: '2 handlers', verdict: 'true', evidence: [{ kind: 'count', ref: 'git ls-files src/handlers | wc -l', excerpt: '2' }] }] };
      proofRun(f.repo, plan);
      const again = proofRun(f.repo, plan);
      // Same code, same statements: every answer, an honest unverified one included, comes from the cache.
      expect(again.report.agent?.cached).toBe(2);
      expect(again.calls.length).toBe(1);
      writeFileSync(join(f.repo, 'src/handlers/c.ts'), 'export function c() {}\n');
      const changed = proofRun(f.repo, plan);
      expect(changed.report.agent?.cached).toBe(0);
    } finally {
      f.cleanup();
    }
  });
});

describe('a missing claude CLI', () => {
  it('reports how to install it and leaves the file untested', () => {
    const f = makeRepo(FILES);
    try {
      const res = spawnSync(process.execPath, [BUNDLE, 'run', 'CLAUDE.md', '--json'], { cwd: f.repo, encoding: 'utf8', env: { ...process.env, PROOF_CLAUDE: join(work, 'nope'), XDG_CACHE_HOME: join(work, 'cache') } });
      const [report] = JSON.parse(res.stdout) as FileReport[];
      expect(report?.agent?.failures[0]).toContain('install Claude Code');
      expect(res.status).toBe(2);
    } finally {
      f.cleanup();
    }
  });
});

describe('evidence checks', () => {
  it('accepts only read-only commands', () => {
    expect(unsafeCommand('git log --oneline -5 -- src')).toBeNull();
    expect(unsafeCommand('git ls-files src | wc -l')).toBeNull();
    expect(unsafeCommand('rm -rf src')).toContain('not a read-only');
    expect(unsafeCommand('git ls-files && touch x')).toContain('chaining');
    expect(unsafeCommand('find . -delete')).toContain('could write');
    expect(unsafeCommand('git branch -D main')).toContain('could write');
  });

  it('checks a file citation against the lines around it, and an absence by re-running the search', () => {
    const f = makeRepo({ 'a.ts': 'const x = 1;\nexport function shown() {}\n' });
    try {
      const repo = new RepoContext(f.repo);
      expect(checkEvidence(repo, { kind: 'file_line', ref: 'a.ts:2', excerpt: 'export function shown()' }).valid).toBe(true);
      expect(checkEvidence(repo, { kind: 'file_line', ref: 'a.ts:40' }).valid).toBe(false);
      expect(checkEvidence(repo, { kind: 'absence', ref: 'git grep -n gone_name' }).valid).toBe(true);
      expect(checkEvidence(repo, { kind: 'absence', ref: 'git grep -n shown' }).valid).toBe(false);
    } finally {
      f.cleanup();
    }
  });
});

describe('budget', () => {
  it('never lets parallel calls together spend past the run budget', () => {
    const f = makeRepo({ ...FILES, 'CLAUDE.md': `# Many\n\n${Array.from({ length: 24 }, (_, i) => `- Statement ${i} is about handlers here.`).join('\n')}\n` });
    try {
      const { report, calls } = proofRun(f.repo, { cost: 0.3 }, '--budget-usd', '1', '--jobs', '4', '--batch-size', '2', '--no-fix');
      const ceilings = calls.map((c) => Number(c.args[c.args.indexOf('--max-budget-usd') + 1]));
      // Each call holds its share while it runs; the fake spends 0.3 per call.
      expect(calls.length * 0.3).toBeLessThanOrEqual(1 + 0.3 * 0.999);
      expect(ceilings.every((c) => c <= 0.5 * 0.8 + 1e-9)).toBe(true);
      expect(report.agent?.failures.join(' ')).toContain('budget');
    } finally {
      f.cleanup();
    }
  });
});
