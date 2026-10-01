// Spec section 10, criteria 1, 3, 4 and 5, driven through the bundle users run.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FileReport } from '../src/pipeline.ts';
import { type Fixture, makeEdgeRepo } from './fixtures/edge.ts';

const BUNDLE = join(import.meta.dirname, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'proof.mjs');

function proof(cwd: string, ...args: string[]): { status: number | null; reports: FileReport[]; stderr: string } {
  const res = spawnSync(process.execPath, [BUNDLE, 'check', ...args, '--json'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: res.status, reports: res.stdout ? (JSON.parse(res.stdout) as FileReport[]) : [], stderr: res.stderr };
}

const span = (r: FileReport, text: string) => r.statements.flatMap((s) => s.results).find((x) => x.text === text);

describe('criterion 3 and 4: the synthetic edge repository', () => {
  let edge: Fixture;
  let report: FileReport;
  let status: number | null;

  beforeAll(() => {
    edge = makeEdgeRepo();
    const run = proof(edge.repo, 'CLAUDE.md');
    status = run.status;
    if (!run.reports[0]) throw new Error(run.stderr);
    report = run.reports[0];
  });
  afterAll(() => edge.cleanup());

  it('runs to a report: no exit 2, the bad manifest named in degraded:, every statement with a result', () => {
    expect(status).not.toBe(2);
    expect(report.degraded.find((d) => d.subject === 'api/package.json')?.reason).toContain('does not parse');
    expect(report.coverage.withResult).toBe(report.coverage.statements);
  });

  it('checks `cd api && yarn start` as `yarn start` in api/', () => {
    expect(span(report, 'yarn start')).toMatchObject({ cwd: 'api', status: 'NOT_CHECKED', blocked: true });
  });

  it('verifies `./scripts/run.sh deploy` against the function', () => {
    expect(span(report, './scripts/run.sh deploy')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
  });

  it('reports `make build` as unconfirmed, not stale, when only web/Makefile defines it', () => {
    expect(span(report, 'make build')?.status).toBe('UNCONFIRMED');
  });

  it('skips ../outside.md as outside the repository and ./bin/no-mistakes as ignored output', () => {
    expect(span(report, '../outside.md')).toMatchObject({ status: 'NOT_CHECKED' });
    expect(span(report, '../outside.md')?.reason).toContain('outside the repository');
    expect(span(report, './bin/no-mistakes')?.reason).toContain('git ignores bin/');
  });

  it('does not verify `MODE=queue` or `req.sessionId`', () => {
    expect(span(report, 'MODE=queue')?.status).toBe('UNCONFIRMED');
    expect(span(report, 'req.sessionId')?.status).toBe('UNCONFIRMED');
  });

  it('finds the true stale lines: Node 24+, the broken import, the missing subcommand', () => {
    expect(span(report, 'Node 24+')?.status).toBe('STALE');
    expect(span(report, 'docs/missing.md')?.status).toBe('STALE');
    expect(span(report, 'bash tools/dev.sh teardown')?.status).toBe('STALE');
  });

  it('matches the dynamic route with literal brackets', () => {
    expect(span(report, 'web/pages/deals/[slug]/index.tsx')?.status).toBe('VERIFIED');
  });

  it('checks a negated mention as an absence (criterion 4)', () => {
    expect(span(report, 'waiting_on')).toMatchObject({ expect: 'absent', status: 'VERIFIED' });
    expect(span(report, 'retry_budget')).toMatchObject({ expect: 'absent', status: 'VERIFIED' });
  });
});

// The reference repository of the spec, pinned. Absent on machines that never cloned it: skip, never pass.
const NO_MISTAKES = process.env.PROOF_NO_MISTAKES ?? join(homedir(), 'projects', 'proof-cache', 'no-mistakes');
const PINNED = 'f4b85ae';
const pinned = existsSync(join(NO_MISTAKES, '.git')) && spawnSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd: NO_MISTAKES, encoding: 'utf8' }).stdout.trim() === PINNED;

describe.skipIf(!pinned)(`criteria 1 and 5: no-mistakes at ${PINNED}`, () => {
  let report: FileReport;
  beforeAll(() => {
    const run = proof(NO_MISTAKES, 'AGENTS.md');
    if (!run.reports[0]) throw new Error(run.stderr);
    report = run.reports[0];
  }, 120_000);

  it('verifies internal/testgit.RealGit against func RealGit and reports no stale line', () => {
    const realGit = span(report, 'internal/testgit.RealGit');
    expect(realGit).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(realGit?.evidence[0]?.ref).toMatch(/^internal\/testgit\/testgit\.go:\d+$/);
    expect(report.counts.STALE).toBe(0);
  });

  it('follows the @AGENTS.md import of CLAUDE.md and reports its statements (criterion 2)', () => {
    const run = proof(NO_MISTAKES, 'CLAUDE.md');
    const [claude, agents] = run.reports;
    expect(claude?.file).toBe('CLAUDE.md');
    expect(claude?.imports.find((i) => i.path === 'AGENTS.md')?.followed).toBe(true);
    expect(agents?.file).toBe('AGENTS.md');
    expect(agents?.importedBy).toEqual(['CLAUDE.md']);
    expect(agents?.statements.length).toBe(report.statements.length);
    expect(claude?.verdict).toBe(agents?.verdict);
  });

  it('never verifies from a comment or a substring, and names the level of every verified span', () => {
    const verifiedSpans = report.statements.flatMap((s) => s.results).filter((r) => r.status === 'VERIFIED');
    expect(verifiedSpans.length).toBeGreaterThan(0);
    for (const r of verifiedSpans) expect(['definition', 'declaration', 'reference']).toContain(r.level);
  });
});
