import type { RepoContext } from '../core/repo.ts';
import type { Syntax } from '../core/syntax.ts';
import type { Evidence, EvidenceLevel, Span, SpanResult } from '../model.ts';

/** Everything a span check may read. One per instruction file. */
export interface CheckContext {
  repo: RepoContext;
  syntax: Syntax;
  /** The instruction file, relative to the repository root. */
  docFile: string;
  /** Its folder, relative to the root ('' at the root): where links and imports resolve from. */
  docDir: string;
  /**
   * Where the paths it names resolve from: its folder, or for a file inside `.claude/`, `.github/`,
   * `.cursor/` and the like, the project folder holding that config folder (agents read paths from there).
   */
  pathBase: string;
}

/** The project folder a config-folder instruction file belongs to, or its own folder. */
export function pathBaseOf(docFile: string, docDir: string): string {
  const cfg = /^(.*?)(?:^|\/)\.(?:claude|cursor|windsurf|github|clinerules)\//.exec(docFile);
  return cfg ? (cfg[1] ?? '') : docDir;
}

/** Keep the instruction file itself out of evidence; a file outside the repository is not in git's view anyway. */
export const docExclude = (ctx: CheckContext): string[] => (ctx.docFile.startsWith('/') || /^[A-Za-z]:[\\/]/.test(ctx.docFile) ? [] : [`:(exclude)${ctx.docFile}`]);

export const verified = (span: Span, level: EvidenceLevel, evidence: Evidence[], reason: string): SpanResult => ({ ...span, status: 'VERIFIED', level, evidence, reason });
export const stale = (span: Span, reason: string, evidence: Evidence[] = []): SpanResult => ({ ...span, status: 'STALE', level: 'none', evidence, reason });
export const unconfirmed = (span: Span, reason: string, evidence: Evidence[] = [], level: EvidenceLevel = 'none'): SpanResult => ({ ...span, status: 'UNCONFIRMED', level, evidence, reason });
export const notChecked = (span: Span, reason: string, evidence: Evidence[] = []): SpanResult => ({ ...span, status: 'NOT_CHECKED', level: 'none', evidence, reason });
/** The check could not run here. Unlike an external tool, this keeps the statement open (D4). */
export const blocked = (span: Span, reason: string): SpanResult => ({ ...span, status: 'NOT_CHECKED', level: 'none', evidence: [], reason, blocked: true });

export const join = (...parts: (string | undefined)[]): string =>
  parts
    .filter((p): p is string => Boolean(p))
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/(^|\/)\.\//g, '$1')
    .replace(/\/$/, '');

/** Folders a span's command or path is read from, most specific first. */
export function workingDirs(ctx: CheckContext, span: Span): string[] {
  const out: string[] = [];
  if (span.cwd !== undefined) out.push(join(ctx.pathBase, span.cwd));
  for (const h of span.hintDirs ?? []) out.push(join(ctx.pathBase, h));
  out.push(ctx.pathBase, ctx.docDir, '');
  return [...new Set(out.map((d) => d.replace(/^\.$/, '')))];
}

export const clip = (s: string, n = 120): string => {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Glob to a regular expression over repository-relative paths: `*` stays in one segment, `**` crosses them. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] ?? '';
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*';
        i += glob[i + 2] === '/' ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

/**
 * Expand `{a|b}` and `{a,b}` alternatives and turn `<name>` placeholders into `*`.
 * Square brackets are left alone here: callers try them literally first (`pages/[slug].tsx`).
 */
export function expandAlternatives(p: string): string[] {
  const withStars = p.replace(/<[^>/]+>/g, '*');
  const alt = withStars.match(/\{([^{}]+)\}/);
  if (!alt) return [withStars];
  return (alt[1] ?? '').split(/[|,]/).flatMap((choice) => expandAlternatives(withStars.replace(alt[0], choice.trim())));
}

/** `[slug]` segments as placeholders: the fallback after a literal match failed. */
export const bracketsAsWildcards = (p: string): string => p.replace(/\[[A-Za-z.][\w.-]*\]/g, '*');
