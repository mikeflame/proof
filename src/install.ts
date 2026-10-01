import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The skill folder this CLI belongs to: the bundle lives in `<skill>/scripts/`, the sources in `src/`. */
export function skillDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  if (existsSync(join(here, '..', 'SKILL.md'))) return join(here, '..');
  return join(here, '..', 'plugins', 'proof', 'skills', 'claude-md');
}

/** Where agents look for user skills (spec 9.4): Claude Code, and the shared ~/.agents layout Codex, OpenCode and Pi read. */
export const INSTALL_TARGETS = { claude: ['.claude', 'skills', 'claude-md'], agents: ['.agents', 'skills', 'claude-md'] } as const;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else out.push(full);
  }
  return out;
}

const same = (a: string, b: string) => existsSync(b) && readFileSync(a).equals(readFileSync(b));

export interface InstallResult {
  target: string;
  state: 'installed' | 'updated' | 'unchanged' | 'refused';
  note: string;
}

/**
 * Copy the skill into each target, idempotently: unchanged files are left alone, a different skill that
 * happens to be called claude-md is never overwritten.
 */
export function install(which: (keyof typeof INSTALL_TARGETS)[], home = homedir()): InstallResult[] {
  const source = skillDir();
  const sourceFiles = files(source).map((f) => relative(source, f));
  return which.map((key) => {
    const target = join(home, ...INSTALL_TARGETS[key]);
    const skill = join(target, 'SKILL.md');
    if (existsSync(skill) && !/scripts\/proof\.mjs/.test(readFileSync(skill, 'utf8'))) {
      return { target, state: 'refused', note: `${skill} is a different skill; move it away to install proof there` };
    }
    const existed = existsSync(target);
    const changed = sourceFiles.filter((f) => !same(join(source, f), join(target, f)));
    const extra = existed ? files(target).map((f) => relative(target, f)).filter((f) => !sourceFiles.includes(f)) : [];
    if (existed && !changed.length && !extra.length) return { target, state: 'unchanged', note: 'already the same version' };
    mkdirSync(target, { recursive: true });
    for (const f of changed) {
      mkdirSync(dirname(join(target, f)), { recursive: true });
      cpSync(join(source, f), join(target, f));
    }
    for (const f of extra) rmSync(join(target, f), { force: true });
    return { target, state: existed ? 'updated' : 'installed', note: `${changed.length} file${changed.length === 1 ? '' : 's'} copied${extra.length ? `, ${extra.length} old removed` : ''}` };
  });
}
