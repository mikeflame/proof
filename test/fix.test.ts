// The fix stage, decisions and reverts (spec 3.5 to 3.7, 4.5, 5): criteria 6, 7, 8 and 9.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vetEdit } from '../src/agent/fix.ts';
import { DEFAULT_CONFIG } from '../src/config.ts';
import { RepoContext } from '../src/core/repo.ts';
import type { DecisionRecord } from '../src/decisions.ts';
import type { FileReport } from '../src/pipeline.ts';
import { Run } from '../src/pipeline.ts';
import { type Fixture, makeRepo } from './fixtures/edge.ts';

const BUNDLE = join(import.meta.dirname, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');
const FAKE = join(import.meta.dirname, 'fixtures', 'fake-claude.mjs');

let work: string;
let f: Fixture;
beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), 'proof-fix-'));
});
afterEach(() => {
  f?.cleanup();
  rmSync(work, { recursive: true, force: true });
});

type Plan = { answers?: Record<string, unknown>[]; fixes?: Record<string, unknown>[]; gaps?: Record<string, unknown>[] };

function proof(plan: Plan, ...args: string[]) {
  writeFileSync(join(work, 'plan.json'), JSON.stringify(plan));
  const res = spawnSync(process.execPath, [BUNDLE, ...args], {
    cwd: f.repo,
    encoding: 'utf8',
    env: { ...process.env, PROOF_CLAUDE: FAKE, FAKE_CLAUDE_PLAN: join(work, 'plan.json'), FAKE_CLAUDE_LOG: join(work, 'calls.jsonl'), XDG_CACHE_HOME: join(work, 'cache') },
  });
  const json = args.includes('--json') && res.stdout ? (JSON.parse(res.stdout) as FileReport[]) : [];
  return { status: res.status, stdout: res.stdout, stderr: res.stderr, report: json[0] };
}

const doc = () => readFileSync(join(f.repo, 'CLAUDE.md'), 'utf8');
const sidecar = (): DecisionRecord[] => (existsSync(join(f.repo, 'CLAUDE.md.proof.json')) ? (JSON.parse(readFileSync(join(f.repo, 'CLAUDE.md.proof.json'), 'utf8')) as DecisionRecord[]) : []);
const calls = () => (existsSync(join(work, 'calls.jsonl')) ? readFileSync(join(work, 'calls.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { prompt: string }) : []);

const NODE_FIX = { match: 'Node 22+', tier: 'A', old: 'Node 22+', new: 'Node 24+', reason: 'engines', evidence: [{ kind: 'file_line', ref: 'package.json:1', excerpt: '"node": ">=24"' }] };
const FILES = { 'CLAUDE.md': '# App\n\n- Requires Node 22+.\n- Sources in `src/`.\n', 'package.json': '{ "engines": { "node": ">=24" } }\n', 'src/a.ts': 'export {};\n' };

describe('fixes', () => {
  it('applies a fix the fresh re-verification accepts, records it, and shows the diff', () => {
    f = makeRepo(FILES);
    const { report, status, stdout } = proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toContain('- Requires Node 24+.');
    expect(report?.statements.find((s) => s.text.includes('Node 24+'))).toMatchObject({ status: 'FIXED', fix: { outcome: 'applied', tier: 'A' } });
    expect(report?.verdict).toBe('FIXED');
    expect(status).toBe(0);
    expect(report?.diff).toContain('+- Requires Node 24+.');
    expect(sidecar().map((r) => [r.kind, r.previous, r.text])).toEqual([['fixed', 'Requires Node 22+.', 'Requires Node 24+.']]);
    expect(stdout).toBeTruthy();
  });

  it('applies a fix that proves what it changed while other wording stays open', () => {
    f = makeRepo({ ...FILES, 'CLAUDE.md': '# App\n\n- Full-stack app on Node 22+.\n- Sources in `src/`.\n' });
    const { report } = proof({ fixes: [{ ...NODE_FIX, match: 'Full-stack' }], answers: [{ match: 'Full-stack app on Node 24+', verdict: 'unverified_with_reason', reason: 'Full-stack is not shown', evidence: [] }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toContain('- Full-stack app on Node 24+.');
    const st = report?.statements.find((s) => s.text.includes('Node 24+'));
    expect(st).toMatchObject({ status: 'UNVERIFIED_WITH_REASON', fix: { outcome: 'applied' } });
    expect(report?.verdict).toBe('PARTLY PROVEN');
  });

  it('reverts a fix the re-verifier rejects and reports FIX_REJECTED (criterion 8)', () => {
    f = makeRepo(FILES);
    const before = doc();
    const { report, status } = proof({ fixes: [{ ...NODE_FIX, new: 'Node 30+' }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toBe(before);
    expect(report?.statements.find((s) => s.text.includes('Node 22+'))).toMatchObject({ status: 'FIX_REJECTED', fix: { outcome: 'rejected' } });
    expect(report?.verdict).toBe('NOT PROVEN');
    expect(status).toBe(1);
    expect(sidecar()[0]).toMatchObject({ kind: 'fix-rejected', edit: { new: 'Node 30+' } });
  });

  it('tries again in a later round, told why the first edit was rejected', () => {
    f = makeRepo(FILES);
    const { report } = proof({ fixes: [{ ...NODE_FIX, new: 'Node 30+', nth: 1 }, { ...NODE_FIX, nth: 2 }] }, 'run', 'CLAUDE.md', '--json', '--fix-rounds', '2');
    expect(doc()).toContain('- Requires Node 24+.');
    expect(report?.counts.FIXED).toBe(1);
    expect(report?.fixes?.map((x) => x.outcome)).toEqual(['rejected', 'applied']);
    const second = calls().filter((c) => c.prompt.startsWith('You correct stale statements'))[1]?.prompt ?? '';
    expect(second).toContain('"rejected_edit":"Node 30+"');
    expect(second).toMatch(/"why":"re-verifier: [a-z ]+: [^"]+"/);
  });

  it('proposes gaps with --gaps, keeps only cited ones, and still writes nothing', () => {
    f = makeRepo(FILES);
    const before = doc();
    const { report } = proof({ gaps: [{ text: '- Build with `npm run build`.', section: 'App', reason: 'r', evidence: [{ kind: 'file_line', ref: 'package.json:1', excerpt: 'engines' }] }, { text: '- Uncited claim.', section: 'App', reason: 'r', evidence: [] }] }, 'run', 'CLAUDE.md', '--json', '--gaps', '--no-fix');
    expect(report?.gaps?.map((g) => g.text)).toEqual(['- Build with `npm run build`.']);
    expect(doc()).toBe(before);
  });

  it('never adds lines without --gaps (criterion 9)', () => {
    f = makeRepo(FILES);
    const before = doc();
    const { report } = proof({ fixes: [{ ...NODE_FIX, new: 'Node 24+.\n- Also requires pnpm 9' }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toBe(before);
    expect(report?.statements.find((s) => s.text.includes('Node 22+'))?.fix).toMatchObject({ outcome: 'refused' });
    expect(report?.statements.find((s) => s.text.includes('Node 22+'))?.fix?.reverify).toContain('adds lines');
  });

  it('joins a fix wrapped onto more lines back onto the lines it replaces', () => {
    f = makeRepo(FILES);
    const lines = doc().split('\n').length;
    proof({ fixes: [{ ...NODE_FIX, new: 'Node 24+\n  (`engines` in package.json)' }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toContain('- Requires Node 24+ (`engines` in package.json).\n');
    expect(doc().split('\n').length).toBe(lines);
  });

  it('deletes a statement only with evidence that its subject is gone', () => {
    f = makeRepo({ 'CLAUDE.md': '# App\n\n- Sources in `src/`.\n- Helpers live in `src/helpers/`.\n', 'src/a.ts': 'export {};\n' });
    const { report } = proof({ fixes: [{ match: 'Helpers', action: 'delete', reason: 'folder is gone', evidence: [{ kind: 'absence', ref: 'git ls-files src/helpers' }] }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toBe('# App\n\n- Sources in `src/`.\n');
    expect(report?.fixes?.[0]).toMatchObject({ action: 'delete', outcome: 'applied' });
  });

  it('shows the diff without writing anything with --dry-run, and never calls the fixer with --no-fix', () => {
    f = makeRepo(FILES);
    const before = doc();
    const dry = proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--dry-run');
    expect(doc()).toBe(before);
    expect(sidecar()).toEqual([]);
    expect(dry.stdout).toContain('## Diff (dry run: not written)');
    expect(dry.stdout).toContain('+- Requires Node 24+.');
    const fixerCalls = () => calls().filter((c) => c.prompt.startsWith('You correct stale statements')).length;
    const n = fixerCalls();
    proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--no-fix');
    expect(fixerCalls()).toBe(n);
    expect(doc()).toBe(before);
  });

  it('commits only the fixed file and its sidecar with --commit', () => {
    f = makeRepo(FILES);
    writeFileSync(join(f.repo, 'src/unrelated.ts'), 'export const x = 1;\n');
    spawnSync('git', ['add', 'src/unrelated.ts'], { cwd: f.repo });
    proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--commit');
    const files = spawnSync('git', ['show', '--name-only', '--format=%s', 'HEAD'], { cwd: f.repo, encoding: 'utf8' }).stdout.trim().split('\n');
    expect(files[0]).toContain('proof fixed 1 stale statement');
    expect(files.slice(1).filter(Boolean).sort()).toEqual(['CLAUDE.md', 'CLAUDE.md.proof.json']);
    expect(spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: f.repo, encoding: 'utf8' }).stdout.trim()).toBe('src/unrelated.ts');
  });

  it('puts a fix back with revert, and the fixer is told never to propose it again', () => {
    f = makeRepo(FILES);
    const run1 = proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--json');
    const id = run1.report?.statements.find((s) => s.status === 'FIXED')?.id ?? '';
    const res = proof({}, 'revert', 'CLAUDE.md', '--id', id.slice(0, 10));
    expect(res.status, res.stderr).toBe(0);
    expect(doc()).toContain('- Requires Node 22+.');
    expect(sidecar().map((r) => r.kind)).toEqual(['fixed', 'fix-rejected']);
    proof({ fixes: [] }, 'run', 'CLAUDE.md');
    expect(calls().filter((c) => c.prompt.startsWith('You correct stale statements')).at(-1)?.prompt).toContain('"rejected_edit":"Node 24+"');
  });
});

describe('decisions', () => {
  const OPEN = { 'CLAUDE.md': '# App\n\n- Requires Node 22+.\n- Keep components small and focused.\n- Prefer composition over inheritance here.\n- Sources in `src/`.\n', 'package.json': '{ "engines": { "node": ">=24" } }\n', 'src/a.ts': 'export {};\n' };

  it('a second run after fixes and decisions has nothing to fix, nothing stale, nothing open; editing one decided line reopens exactly it (criterion 6)', () => {
    f = makeRepo(OPEN);
    expect(proof({ fixes: [NODE_FIX] }, 'run', 'CLAUDE.md', '--json').report?.counts.FIXED).toBe(1);
    expect(proof({}, 'decide', 'CLAUDE.md').stdout).toContain('Keep components small');
    for (const line of ['L4', 'L5']) {
      const res = proof({}, 'decide', 'CLAUDE.md', line, '--rule', '--reason', 'team convention, no tooling enforces it');
      expect(res.status, res.stderr).toBe(0);
    }
    const second = proof({}, 'run', 'CLAUDE.md', '--json').report;
    expect(second?.fixes ?? []).toEqual([]);
    expect(second?.counts).toMatchObject({ STALE: 0, UNCONFIRMED: 0, UNVERIFIED_WITH_REASON: 0, DECIDED: 2, FIX_REJECTED: 0 });
    expect(second?.verdict).toBe('PROVEN');

    writeFileSync(join(f.repo, 'CLAUDE.md'), doc().replace('Keep components small and focused.', 'Keep components under 300 lines.'));
    const third = proof({}, 'run', 'CLAUDE.md', '--json').report;
    expect(third?.counts.DECIDED).toBe(1);
    expect(third?.counts.UNVERIFIED_WITH_REASON).toBe(1);
    expect(third?.reopened.map((d) => d.text)).toEqual(['Keep components small and focused.']);
  });

  it('refuses a fact without evidence and a stale statement', () => {
    f = makeRepo(OPEN);
    expect(proof({}, 'decide', 'CLAUDE.md', 'L5', '--fact', '--reason', 'I know it').stderr).toContain('never decide a fact without evidence');
    expect(proof({}, 'decide', 'CLAUDE.md', 'L3', '--rule', '--reason', 'x').stderr).toContain('is stale');
    const ok = proof({}, 'decide', 'CLAUDE.md', 'L5', '--fact', '--evidence', 'src/a.ts:1', '--reason', 'see a.ts');
    expect(ok.status, ok.stderr).toBe(0);
  });

  it('shows the age of a decision and keeps the repository’s word over it', async () => {
    f = makeRepo(OPEN);
    proof({}, 'decide', 'CLAUDE.md', 'L4', '--rule', '--reason', 'convention');
    spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'later'], { cwd: f.repo });
    const r = await new Run(f.repo).checkFile('CLAUDE.md');
    expect(r.statements.find((s) => s.line === 4)?.reason).toMatch(/1 commit ago/);
  });
});

describe('policy, applied by proof', () => {
  it('never edits a managed file, a user file without --user, or deletes a rule', () => {
    f = makeRepo({ 'CLAUDE.md': '- Never use `oldTool`.\n', 'a.ts': 'export {};\n' });
    const repo = new RepoContext(f.repo);
    const source = '- Never use `oldTool`.\n';
    const st = { id: 'x', line: 1, endLine: 1, residual: ['rule "Never"'], results: [] } as unknown as Parameters<typeof vetEdit>[2];
    const raw = { action: 'replace', tier: 'B', old: '`oldTool`', new: '`newTool`', evidence: [{ kind: 'file_line', ref: 'a.ts:1', excerpt: 'export {};' }], reason: 'r' };
    const opts = { model: 'm', effort: 'high', budgetUsd: 1, timeoutMs: 1000, user: false, config: DEFAULT_CONFIG };
    expect(vetEdit(repo, source, st, raw, 'managed', opts)?.refused).toContain('managed');
    expect(vetEdit(repo, source, st, raw, 'user', opts)?.refused).toContain('--user');
    expect(vetEdit(repo, source, st, raw, 'user', { ...opts, user: true })?.refused).toBeNull();
    expect(vetEdit(repo, source, st, { ...raw, action: 'delete' }, 'project', opts)?.refused).toContain('never deleted');
    expect(vetEdit(repo, source, st, { ...raw, evidence: [] }, 'project', opts)?.refused).toContain('without evidence');
    expect(vetEdit(repo, source, st, raw, 'project', { ...opts, config: { ...DEFAULT_CONFIG, autofix: { A: true, B: false, C: true } } })?.refused).toContain('switched off');
  });
});

describe('deletion guard', () => {
  it('never deletes a statement that itself says the thing is empty', () => {
    f = makeRepo({ 'CLAUDE.md': '# App\n\n- Experiments go in `src/experimental/`. Currently empty.\n- Sources in `src/`.\n', 'src/a.ts': 'export {};\n' });
    const before = doc();
    const { report } = proof({ fixes: [{ match: 'Experiments', action: 'delete', reason: 'gone', evidence: [{ kind: 'absence', ref: 'git ls-files src/experimental' }] }] }, 'run', 'CLAUDE.md', '--json');
    expect(doc()).toBe(before);
    expect(report?.fixes?.[0]?.refused).toContain('says the thing is empty');
  });
});
