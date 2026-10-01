import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, posix } from 'node:path';
import { ignoredFiles } from './core/git.ts';
import type { RepoContext } from './core/repo.ts';

/** Where an instruction file comes from: who wrote it and whether proof may edit it. */
export type Scope = 'project' | 'local' | 'user' | 'managed' | 'import';

export interface Discovered {
  /** Repository-relative, or absolute for user and managed files. */
  file: string;
  /** Which agent loads it, and when. */
  why: string;
  scope: Scope;
}

const CLAUDE_AGENTS = 'Claude Code reads it only when no CLAUDE.md, .claude/CLAUDE.md or CLAUDE.local.md is in the folder or above it, and Codex, Cursor and others read it always';

/** Project files every agent loads, by path pattern. Spec 3.1. */
const PROJECT_FILES: [RegExp, string, Scope][] = [
  [/(^|\/)CLAUDE\.md$/, 'Claude Code project instructions (at launch for this folder and above, on demand below)', 'project'],
  [/(^|\/)CLAUDE\.local\.md$/, 'Claude Code local instructions, loaded after CLAUDE.md in the same folder', 'local'],
  [/(^|\/)\.claude\/AGENTS\.md$/, CLAUDE_AGENTS, 'project'],
  [/(^|\/)AGENTS\.md$/, CLAUDE_AGENTS, 'project'],
  [/(^|\/)\.claude\/rules\/.+\.md$/, 'Claude Code rule: at launch, or when a file matching its paths: is read', 'project'],
  [/^\.github\/copilot-instructions\.md$/, 'GitHub Copilot repository instructions', 'project'],
  [/^\.github\/instructions\/.+\.instructions\.md$/, 'GitHub Copilot path instructions (applyTo:)', 'project'],
  [/(^|\/)GEMINI\.md$/, 'Gemini CLI instructions', 'project'],
  [/(^|\/)\.cursor\/rules\/.+\.mdc?$/, 'Cursor rule', 'project'],
  [/(^|\/)\.cursorrules$/, 'Cursor rules (legacy file)', 'project'],
  [/(^|\/)\.windsurfrules$/, 'Windsurf rules', 'project'],
  [/(^|\/)\.windsurf\/rules\/.+\.md$/, 'Windsurf rule', 'project'],
  [/(^|\/)\.clinerules(\/.+\.md)?$/, 'Cline rules', 'project'],
  [/(^|\/)CONVENTIONS\.md$/, 'Aider conventions', 'project'],
];

/** Never read by any agent as instructions (Claude Code documents these as skipped). */
const NOT_LOADED = /(^|\/)(AGENTS\.local\.md|AGENTS\.override\.md)$|(^|\/)\.agents\//;

/** Instruction files inside test data are inputs to tests, not instructions to this repository's agents. */
const FIXTURES = /(^|\/)(fixtures?|__fixtures__|testdata|test-data|__snapshots__|examples?)\//;

export const MANAGED_PATHS: Record<string, string> = {
  linux: '/etc/claude-code/CLAUDE.md',
  darwin: '/Library/Application Support/ClaudeCode/CLAUDE.md',
  win32: 'C:\\Program Files\\ClaudeCode\\CLAUDE.md',
};

export interface Discovery {
  files: Discovered[];
  /** Instruction-named files left out on purpose, with the reason: reported, never dropped silently. */
  skipped: { file: string; reason: string }[];
}

function classify(file: string): Discovered | null {
  for (const [re, why, scope] of PROJECT_FILES) if (re.test(file)) return { file, why, scope };
  return null;
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    try {
      if (statSync(full).isDirectory()) out.push(...walkMarkdown(full));
      else if (name.endsWith('.md')) out.push(full);
    } catch {
      // a dangling link: nothing to read
    }
  }
  return out;
}

/**
 * Every instruction file an agent would load in this repository, root first, each real file once (a
 * CLAUDE.md is often a symlink to AGENTS.md). With `user`, also the user's own files and the managed
 * policy file of this machine, which proof checks but never edits.
 */
export function discover(repo: RepoContext, opts: { user?: boolean } = {}): Discovery {
  const found: Discovered[] = [];
  const skipped: { file: string; reason: string }[] = [];
  const candidates = [...repo.files];
  // A gitignored CLAUDE.local.md is the usual case, and Claude Code still loads it.
  if (repo.isGit) for (const f of ignoredFiles(repo.root, ['**/CLAUDE.local.md', 'CLAUDE.local.md'])) if (!candidates.includes(f)) candidates.push(f);
  for (const file of candidates) {
    const hit = classify(file);
    if (!hit) continue;
    if (NOT_LOADED.test(file)) {
      skipped.push({ file, reason: 'no agent loads it (Claude Code skips AGENTS.local.md, AGENTS.override.md and anything under .agents/)' });
      continue;
    }
    if (FIXTURES.test(file)) {
      skipped.push({ file, reason: 'inside a test-data or examples folder; pass it by name to check it' });
      continue;
    }
    found.push(hit);
  }
  found.sort((a, b) => a.file.split('/').length - b.file.split('/').length || a.file.localeCompare(b.file));

  if (opts.user) {
    const home = join(homedir(), '.claude');
    const managed = MANAGED_PATHS[platform()];
    if (managed && existsSync(managed)) found.push({ file: managed, why: 'managed policy instructions for every user of this machine; listed and checked, never edited', scope: 'managed' });
    if (existsSync(join(home, 'CLAUDE.md'))) found.push({ file: join(home, 'CLAUDE.md'), why: 'your user instructions, loaded in every project', scope: 'user' });
    for (const f of walkMarkdown(join(home, 'rules')).sort()) found.push({ file: f, why: 'your user rule, loaded in every project', scope: 'user' });
  }

  const seen = new Set<string>();
  const files = found.filter((d) => {
    let real = d.file;
    try {
      real = realpathSync(posix.isAbsolute(d.file) ? d.file : join(repo.root, d.file));
    } catch {
      // keep the path as is
    }
    if (seen.has(real)) return false;
    seen.add(real);
    return true;
  });
  return { files, skipped };
}
