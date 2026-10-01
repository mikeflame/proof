import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The bundled script is what users run, so these tests drive it, not the sources.
const SCRIPT = join(import.meta.dirname, '..', 'plugins', 'proof', 'skills', 'claude-md', 'scripts', 'claims.mjs');
let repo: string;

const run = (...args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: repo, encoding: 'utf8' });

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'proof-cli-'));
  const files: Record<string, string> = {
    'AGENTS.md': '# Agents\n\n- Run `yarn dev` to start.\n- Business logic lives in `src/services/`.\n',
    'web/CLAUDE.md': '# Web\n\n- Pages are in `pages/`.\n',
    'web/pages/index.ts': 'export {};\n',
    'package.json': JSON.stringify({ name: 'x', scripts: { dev: 'x' } }),
    'src/index.ts': 'export {};\n',
  };
  for (const [file, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), body);
  }
  symlinkSync('AGENTS.md', join(repo, 'CLAUDE.md'));
  spawnSync('git', ['init', '-q'], { cwd: repo });
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe('bundled claims.mjs', () => {
  it('finds every instruction file, checks a symlinked one once, and exits 1 on stale lines', () => {
    const res = run();
    expect(res.status, res.stderr).toBe(1);
    const headings = res.stdout.split('\n').filter((l) => l.startsWith('# '));
    expect(headings).toEqual(['# AGENTS.md: NOT PROVEN', '# web/CLAUDE.md: PROVEN']);
    expect(res.stdout).toContain('`src/services/` — not found: src/services/');
  });

  it('checks a single file and resolves paths from that file\'s folder', () => {
    const res = run('web/CLAUDE.md');
    expect(res.status, res.stderr).toBe(0);
    expect(res.stdout).toContain('`pages/` — found under web/: web/pages');
  });

  it('prints JSON and writes reports with --out, without touching the repository', () => {
    const out = mkdtempSync(join(tmpdir(), 'proof-out-'));
    try {
      const res = run('AGENTS.md', '--json', '--out', out);
      const report = JSON.parse(res.stdout) as { verdict: string; counts: Record<string, number> };
      expect(report.verdict).toBe('NOT PROVEN');
      expect(report.counts.STALE).toBe(1);
      expect(readFileSync(join(out, 'agents.md.md'), 'utf8')).toContain('# AGENTS.md: NOT PROVEN');
      expect(spawnSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' }).stdout).not.toContain('.proof');
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });

  it('exits 2 for a missing file and prints help', () => {
    expect(run('NOPE.md').status).toBe(2);
    expect(run('--help').stdout).toContain('is your CLAUDE.md still true?');
  });
});
