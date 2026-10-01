/**
 * Globs as Claude Code reads a rule's `paths:` frontmatter: `*`, `**`, `?`, brace expansion, and `[` as
 * the start of a bracket expression (`\[` for a literal one). A pattern with a `[` that cannot be read as
 * a bracket expression matches nothing.
 */

const BRACE_BUDGET = 1000;

/** `src/*.{ts,tsx}` → `src/*.ts`, `src/*.tsx`. Past the budget the pattern stays as written, as Claude Code does. */
export function expandBraces(pattern: string): string[] {
  let out = [pattern];
  for (let guard = 0; guard < 32; guard++) {
    let changed = false;
    const next: string[] = [];
    for (const p of out) {
      const m = /\{([^{}]*,[^{}]*)\}/.exec(p);
      if (!m) {
        next.push(p);
        continue;
      }
      changed = true;
      for (const alt of (m[1] ?? '').split(',')) next.push(p.slice(0, m.index) + alt + p.slice(m.index + m[0].length));
    }
    if (next.length > BRACE_BUDGET) return [pattern];
    out = next;
    if (!changed) break;
  }
  return out;
}

export type CompiledGlob = { re: RegExp } | { error: string };

/** Compile one brace-free pattern; an unterminated `[` is an error, and the pattern matches nothing. */
export function compileGlob(pattern: string): CompiledGlob {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i] ?? '';
    if (c === '\\' && i + 1 < pattern.length) {
      re += (pattern[i + 1] ?? '').replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
      i++;
    } else if (c === '*') {
      if (pattern[i + 1] === '*') {
        const slash = pattern[i + 2] === '/';
        re += slash ? '(?:[^/]+/)*' : '.*';
        i += slash ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = pattern.indexOf(']', i + 2);
      if (end < 0) return { error: `"${pattern}" has a [ that starts no bracket expression; Claude Code matches no file with it (write \\[ for a literal bracket)` };
      const body = pattern.slice(i + 1, end).replace(/^!/, '^').replace(/\\/g, '\\\\');
      re += `[${body}]`;
      i = end;
    } else re += c.replace(/[.+^${}()|\\/]/g, '\\$&');
  }
  return { re: new RegExp(`^${re}$`) };
}

/** Repository files a `paths:` entry matches, relative to `base`, or the reason it matches nothing by construction. */
export function matchGlob(pattern: string, files: string[], base = ''): { files: string[]; error: string | null } {
  const prefix = base ? `${base}/` : '';
  const out = new Set<string>();
  let error: string | null = null;
  for (const p of expandBraces(pattern.replace(/^\.\//, ''))) {
    const compiled = compileGlob(p);
    if ('error' in compiled) {
      error = compiled.error;
      continue;
    }
    for (const f of files) if (f.startsWith(prefix) && compiled.re.test(f.slice(prefix.length))) out.add(f);
  }
  return { files: [...out].sort(), error };
}
