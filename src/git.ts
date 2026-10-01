import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Directory, relative to the repository root, where receipts are written. */
export const PROOF_DIR = '.proof';

export interface GitState {
  root: string;
  /** Hash of the working tree as it is on disk, including untracked files that are not ignored. */
  tree: string;
  /** HEAD commit, or null in a repository without commits. */
  head: string | null;
}

const git = (cwd: string, args: string[], env?: NodeJS.ProcessEnv): string =>
  execFileSync('git', args, { cwd, env: env ?? process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** The repository root containing `cwd`, or null when `cwd` is not inside a git work tree. */
export function repoRoot(cwd: string): string | null {
  try {
    return git(cwd, ['rev-parse', '--show-toplevel']);
  } catch {
    return null;
  }
}

/**
 * Hash the working tree exactly as it is on disk.
 *
 * Stages everything into a throwaway copy of the index and writes a tree object from it, so the
 * user's real index, stash and history are never touched. A clean checkout hashes to `HEAD^{tree}`;
 * any edit, new file or deletion gives a different hash. This is what binds a receipt to one build.
 */
export function workingTreeHash(root: string): string {
  const gitDir = git(root, ['rev-parse', '--absolute-git-dir']);
  const tmp = mkdtempSync(join(tmpdir(), 'proof-index-'));
  const index = join(tmp, 'index');
  try {
    const realIndex = join(gitDir, 'index');
    // Seeding from the real index keeps the stat cache, so large repos don't rehash every file.
    if (existsSync(realIndex)) copyFileSync(realIndex, index);
    const env = { ...process.env, GIT_INDEX_FILE: index };
    git(root, ['add', '--all', '--', '.'], env);
    // Receipts live in .proof/ inside the repository; writing one must not change the hash it proves.
    // Unstaging after the add works whether or not .proof/ is in .gitignore (an exclude pathspec
    // makes `git add` fail when the path is ignored).
    git(root, ['rm', '-r', '--cached', '--quiet', '--ignore-unmatch', '--', PROOF_DIR], env);
    return git(root, ['write-tree'], env);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** HEAD commit, or null when the repository has no commits yet. */
export function headCommit(root: string): string | null {
  try {
    return git(root, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  } catch {
    return null;
  }
}

/** Current branch, and how many commits it is behind its upstream (or origin's default branch). */
export function branchInfo(root: string): { branch: string | null; behind: number | null; upstream: string | null } {
  const safe = (args: string[]): string | null => {
    try {
      return git(root, args) || null;
    } catch {
      return null;
    }
  };
  const branch = safe(['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safe(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']) ?? safe(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  const behind = upstream ? Number(safe(['rev-list', '--count', `HEAD..${upstream}`]) ?? 'NaN') : Number.NaN;
  return { branch: branch === 'HEAD' ? null : branch, upstream, behind: Number.isFinite(behind) ? behind : null };
}

/** Git state for the repository containing `cwd`, or null outside a repository. */
export function gitState(cwd: string): GitState | null {
  const root = repoRoot(cwd);
  if (!root) return null;
  return { root, tree: workingTreeHash(root), head: headCommit(root) };
}
