import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import type { RepoContext } from './core/repo.ts';

export interface Discovered {
  file: string;
  /** Why an agent loads it: which agent and which rule. */
  why: string;
}

const PROJECT_FILES: [RegExp, string][] = [
  [/(^|\/)CLAUDE\.md$/, 'Claude Code memory'],
  [/(^|\/)\.claude\/CLAUDE\.md$/, 'Claude Code memory'],
  [/(^|\/)CLAUDE\.local\.md$/, 'Claude Code local memory'],
  [/(^|\/)AGENTS\.md$/, 'AGENTS.md (Codex, Claude Code and others)'],
  [/(^|\/)\.claude\/AGENTS\.md$/, 'Claude Code reads it like AGENTS.md'],
  [/(^|\/)\.claude\/rules\/.+\.md$/, 'Claude Code rule'],
];

/** Instruction files in the repository, root first, each real file once (CLAUDE.md is often a symlink to AGENTS.md). */
export function discover(repo: RepoContext): Discovered[] {
  const out: Discovered[] = [];
  for (const file of repo.files) {
    const hit = PROJECT_FILES.find(([re]) => re.test(file));
    if (hit) out.push({ file, why: hit[1] });
  }
  out.sort((a, b) => a.file.split('/').length - b.file.split('/').length || a.file.localeCompare(b.file));
  const seen = new Set<string>();
  return out.filter((d) => {
    let real = d.file;
    try {
      real = realpathSync(join(repo.root, d.file));
    } catch {
      // keep the path as is
    }
    if (seen.has(real)) return false;
    seen.add(real);
    return true;
  });
}
