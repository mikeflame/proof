import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface GitState {
  root: string;
  /** Hash of the working tree as it is on disk, including untracked files that are not ignored. */
  tree: string;
  /** HEAD commit, or null in a repository without commits. */
  head: string | null;
  branch: string | null;
  upstream: string | null;
  /** Commits HEAD is behind its upstream (or origin's default branch); null when unknown. */
  behind: number | null;
}

const run = (cwd: string, args: string[], env?: NodeJS.ProcessEnv): string =>
  execFileSync('git', args, { cwd, env: env ?? process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }).trim();

const safe = (cwd: string, args: string[]): string | null => {
  try {
    return run(cwd, args) || null;
  } catch {
    return null;
  }
};

export function gitAvailable(): boolean {
  return spawnSync('git', ['--version'], { stdio: 'ignore' }).status === 0;
}

/** The repository root containing `cwd`, or null when `cwd` is not inside a git work tree. */
export function repoRoot(cwd: string): string | null {
  return safe(cwd, ['rev-parse', '--show-toplevel']);
}

/**
 * Hash the working tree exactly as it is on disk, through a throwaway copy of the index so the
 * real index, stash and history are never touched. A clean checkout hashes to `HEAD^{tree}`.
 */
export function workingTreeHash(root: string): string {
  const gitDir = run(root, ['rev-parse', '--absolute-git-dir']);
  const tmp = mkdtempSync(join(tmpdir(), 'proof-index-'));
  const index = join(tmp, 'index');
  try {
    const realIndex = join(gitDir, 'index');
    if (existsSync(realIndex)) copyFileSync(realIndex, index);
    const env = { ...process.env, GIT_INDEX_FILE: index };
    run(root, ['add', '--all', '--', '.'], env);
    return run(root, ['write-tree'], env);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function gitState(cwd: string): GitState | null {
  const root = repoRoot(cwd);
  if (!root) return null;
  const branch = safe(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safe(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']) ?? safe(root, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  const behindText = upstream ? safe(root, ['rev-list', '--count', `HEAD..${upstream}`]) : null;
  return {
    root,
    tree: workingTreeHash(root),
    head: safe(root, ['rev-parse', '--verify', '--quiet', 'HEAD']),
    branch: branch === 'HEAD' ? null : branch,
    upstream,
    behind: behindText === null ? null : Number(behindText),
  };
}

/** Tracked and untracked files git does not ignore, relative to the root. */
export function listFiles(root: string): string[] {
  const out = run(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  // Tracked files deleted from the working tree are still in the index; the checks read the working tree.
  const deleted = new Set(run(root, ['ls-files', '-z', '--deleted']).split('\0').filter(Boolean));
  return [...new Set(out.split('\0').filter((f) => f && !deleted.has(f)))];
}

/** The deepest symlink at or above `rel`, relative to the root. */
function symlinkAbove(root: string, rel: string): string | null {
  const parts = rel.replace(/\/$/, '').split('/');
  for (let i = parts.length; i > 0; i--) {
    const p = parts.slice(0, i).join('/');
    try {
      if (lstatSync(join(root, p)).isSymbolicLink()) return p;
    } catch {
      // absent: keep looking above
    }
  }
  return null;
}

/**
 * Which of `paths` git would ignore, one process for the whole batch; null when git check-ignore failed.
 * git rejects the whole batch over one bad pathspec ("beyond a symbolic link"); paths under that link
 * are then asked about the link itself and the batch is retried.
 */
export function ignoredPaths(root: string, paths: string[]): Set<string> | null {
  // asked path -> the requested paths it answers for
  const asked = new Map<string, Set<string>>(paths.map((p) => [p, new Set([p])]));
  for (let attempt = 0; attempt < 32 && asked.size; attempt++) {
    const res = spawnSync('git', ['check-ignore', '--stdin', '-z'], { cwd: root, input: [...asked.keys()].join('\0') + '\0', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (res.status === 0 || res.status === 1) {
      const hits = new Set<string>();
      for (const h of res.stdout.split('\0').filter(Boolean)) for (const p of asked.get(h) ?? [h]) hits.add(p);
      return hits;
    }
    const bad = res.stderr.match(/pathspec '(.+?)' is beyond a symbolic link/)?.[1];
    if (!bad || !asked.has(bad)) return null;
    // Everything under the link is asked about the link itself.
    const link = symlinkAbove(root, bad) ?? bad.replace(/\/$/, '');
    const merged = asked.get(link) ?? new Set<string>();
    for (const [q, originals] of [...asked]) {
      if (q !== bad && !q.startsWith(`${link}/`)) continue;
      for (const o of originals) merged.add(o);
      asked.delete(q);
    }
    asked.set(link, merged);
  }
  return asked.size ? null : new Set();
}

export type GrepResult = { status: 'match'; lines: GrepHit[] } | { status: 'miss' } | { status: 'error'; message: string };

export interface GrepHit {
  file: string;
  line: number;
  column: number;
  text: string;
}

/**
 * `git grep` over tracked and untracked code. Exit 1 means no match; anything else is an error,
 * which callers must report as not checked, never as "not found".
 */
export function gitGrep(root: string, needle: string, opts: { word?: boolean; pathspec?: string[]; limit?: number } = {}): GrepResult {
  const args = ['grep', '-I', '--untracked', '-F', '-n', '--column', ...(opts.word ? ['-w'] : []), '-e', needle, '--', ...(opts.pathspec ?? ['.'])];
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (res.status === 1) return { status: 'miss' };
  if (res.status !== 0) return { status: 'error', message: (res.stderr || res.error?.message || `git grep exited ${res.status}`).split('\n')[0] ?? 'git grep failed' };
  const lines: GrepHit[] = [];
  for (const raw of res.stdout.split('\n')) {
    if (!raw) continue;
    const m = raw.match(/^(.*?):(\d+):(\d+):(.*)$/);
    if (!m) continue;
    lines.push({ file: m[1] ?? '', line: Number(m[2]), column: Number(m[3]), text: m[4] ?? '' });
    if (opts.limit && lines.length >= opts.limit) break;
  }
  return { status: 'match', lines };
}

/** Last commit that touched a path: `{ sha, date, subject }`, or null. */
export function lastChange(root: string, path: string): { sha: string; date: string; subject: string } | null {
  const out = safe(root, ['log', '-1', '--format=%h%x09%ad%x09%s', '--date=short', '--', path]);
  if (!out) return null;
  const [sha = '', date = '', subject = ''] = out.split('\t');
  return { sha, date, subject };
}
