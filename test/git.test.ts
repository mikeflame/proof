import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gitGrep, gitState, ignoredPaths, listFiles, repoRoot, workingTreeHash } from '../src/core/git.ts';

const run = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

let repo: string;

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'proof-git-'));
  run(repo, 'init', '-q', '-b', 'main');
  run(repo, 'config', 'user.email', 'test@example.com');
  run(repo, 'config', 'user.name', 'Test');
  run(repo, 'config', 'commit.gpgsign', 'false');
  writeFileSync(join(repo, 'a.txt'), 'one\n');
  writeFileSync(join(repo, '.gitignore'), 'ignored/\n*.log\nbin/\n');
  run(repo, 'add', '-A');
  run(repo, 'commit', '-q', '-m', 'init');
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('workingTreeHash', () => {
  it('equals HEAD^{tree} on a clean checkout', () => {
    expect(workingTreeHash(repo)).toBe(run(repo, 'rev-parse', 'HEAD^{tree}'));
  });

  it('is stable for the same tree and changes with any edit', () => {
    const clean = workingTreeHash(repo);
    writeFileSync(join(repo, 'a.txt'), 'two\n');
    const edited = workingTreeHash(repo);
    expect(edited).not.toBe(clean);
    expect(workingTreeHash(repo)).toBe(edited);
    writeFileSync(join(repo, 'a.txt'), 'one\n');
    expect(workingTreeHash(repo)).toBe(clean);
  });

  it('counts untracked files and deletions but not ignored files', () => {
    const clean = workingTreeHash(repo);
    writeFileSync(join(repo, 'debug.log'), 'noise\n');
    expect(workingTreeHash(repo)).toBe(clean);
    writeFileSync(join(repo, 'new.txt'), 'new\n');
    const withNew = workingTreeHash(repo);
    expect(withNew).not.toBe(clean);
    unlinkSync(join(repo, 'new.txt'));
    unlinkSync(join(repo, 'a.txt'));
    expect(workingTreeHash(repo)).not.toBe(clean);
  });

  it('never touches the real index or the stash', () => {
    writeFileSync(join(repo, 'a.txt'), 'two\n');
    writeFileSync(join(repo, 'untracked.txt'), 'x\n');
    const index = join(repo, '.git', 'index');
    const before = { bytes: readFileSync(index), mtime: statSync(index).mtimeMs };
    workingTreeHash(repo);
    expect(readFileSync(index).equals(before.bytes)).toBe(true);
    expect(statSync(index).mtimeMs).toBe(before.mtime);
    expect(run(repo, 'diff', '--cached', '--name-only')).toBe('');
    expect(run(repo, 'stash', 'list')).toBe('');
  });

  it('works in a repository without commits', () => {
    const empty = mkdtempSync(join(tmpdir(), 'proof-empty-'));
    try {
      run(empty, 'init', '-q');
      writeFileSync(join(empty, 'f.txt'), 'f\n');
      expect(workingTreeHash(empty)).toMatch(/^[0-9a-f]{40}$/);
      expect(gitState(empty)?.head).toBeNull();
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe('gitState', () => {
  it('returns null outside a repository', () => {
    const plain = mkdtempSync(join(tmpdir(), 'proof-plain-'));
    try {
      expect(repoRoot(plain)).toBeNull();
      expect(gitState(plain)).toBeNull();
    } finally {
      rmSync(plain, { recursive: true, force: true });
    }
  });

  it('reports root, tree and head inside a repository', () => {
    const s = gitState(repo);
    expect(s?.head).toBe(run(repo, 'rev-parse', 'HEAD'));
    expect(s?.tree).toBe(run(repo, 'rev-parse', 'HEAD^{tree}'));
    expect(s?.root).toBe(run(repo, 'rev-parse', '--show-toplevel'));
  });
});

describe('file listing and ignore rules', () => {
  it('lists untracked files and leaves out deleted ones', () => {
    writeFileSync(join(repo, 'new.txt'), 'x\n');
    unlinkSync(join(repo, 'a.txt'));
    const files = listFiles(repo);
    expect(files).toContain('new.txt');
    expect(files).not.toContain('a.txt');
  });

  it('matches directory patterns for folders that do not exist, and survives paths under a symlink', () => {
    mkdirSync(join(repo, 'real'));
    symlinkSync('real', join(repo, 'link'));
    const hits = ignoredPaths(repo, ['bin/', 'bin/tool', 'link/', 'link/x/', 'a.txt']);
    expect(hits).not.toBeNull();
    expect([...(hits ?? [])].sort()).toEqual(['bin/', 'bin/tool']);
  });

  it('reports a failed grep as an error, never as a miss', () => {
    expect(gitGrep(repo, 'one', { pathspec: [':(bad-magic)x'] }).status).toBe('error');
    expect(gitGrep(repo, 'nothing-here-at-all').status).toBe('miss');
  });
});
