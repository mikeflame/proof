import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { isAbsolute, join as joinFs, posix } from 'node:path';
import type { Span, SpanResult } from '../model.ts';
import { matchGlob } from '../core/glob.ts';
import { stringInCode } from './symbols.ts';
import { bracketsAsWildcards, type CheckContext, expandAlternatives, globToRegExp, join, notChecked, stale, unconfirmed, verified, workingDirs } from './util.ts';

/** Files and folders under `base` that match `pattern` (literal or glob). */
function matches(ctx: CheckContext, base: string, pattern: string): string[] {
  const wantDir = pattern.endsWith('/');
  const clean = join(base, pattern.replace(/^\.\//, '').replace(/\/$/, ''));
  if (clean === '' || clean === '.') return [''];
  if (!/[*?]/.test(clean)) {
    if (!ctx.repo.exists(clean)) return [];
    if (wantDir && !ctx.repo.isDir(clean)) return [];
    return [clean];
  }
  const re = globToRegExp(clean);
  const pool = wantDir ? [...ctx.repo.dirs] : [...ctx.repo.files, ...ctx.repo.dirs];
  return pool.filter((f) => re.test(f)).sort();
}

const shown = (all: string[]): string => {
  const head = all.slice(0, 3).map((p) => p || '.').join(', ');
  return all.length > 3 ? `${head} and ${all.length - 3} more` : head;
};

/** Literal first, then `[slug]` as a placeholder; every `{a|b}` alternative must exist. */
function resolveIn(ctx: CheckContext, base: string, text: string): string[] | null {
  for (const variant of [text, bracketsAsWildcards(text)]) {
    const found = expandAlternatives(variant).map((p) => matches(ctx, base, p));
    if (found.every((f) => f.length > 0)) return [...new Set(found.flat())];
    if (variant === bracketsAsWildcards(variant)) break;
  }
  return null;
}

/** Paths anywhere in the repository that end with `text` (dot-folders included). */
function anywhere(ctx: CheckContext, text: string): string[] {
  const pattern = bracketsAsWildcards(text.replace(/^\.\//, '').replace(/\/$/, ''));
  const out = new Set<string>();
  for (const p of expandAlternatives(pattern)) {
    const re = globToRegExp(`**/${p}`);
    for (const f of [...ctx.repo.files, ...ctx.repo.dirs]) if (re.test(f)) out.add(f);
  }
  return [...out].sort();
}

function absent(span: Span, found: string[] | null): SpanResult {
  return found?.length
    ? stale(span, `said to be gone, but still exists: ${shown(found)}`, found.slice(0, 3).map((f) => ({ ref: f || '.', level: 'definition' })))
    : verified(span, 'definition', [{ ref: `no ${span.text} in the repository`, level: 'definition' }], 'absent, as the statement says');
}

/** A file, folder or glob named in the instruction file. */
export function checkPath(ctx: CheckContext, span: Span): SpanResult {
  const t = span.text.trim();
  if (t.startsWith('/') || t.startsWith('~')) return notChecked(span, 'outside the repository');
  const bases = workingDirs(ctx, span);
  const primary = bases[0] ?? '';
  const rel = ctx.repo.rel(t.replace(/\/$/, ''), primary);
  if (rel === null) return notChecked(span, 'outside the repository');
  const ignoredBy = ctx.repo.ignored(rel + (t.endsWith('/') ? '/' : ''));
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: generated output, not committed files`);

  const candidates = [...bases, ...ctx.repo.projectDirs.filter((d) => !bases.includes(d))];
  for (const base of candidates) {
    const found = resolveIn(ctx, base, t);
    if (!found) continue;
    if (span.expect === 'absent') return absent(span, found);
    const note = base && !bases.includes(base) ? `found under ${base}/: ` : '';
    return verified(span, 'definition', found.slice(0, 3).map((f) => ({ ref: f || '.', level: 'definition' })), `${note}${shown(found)}`);
  }
  if (span.expect === 'absent') {
    const elsewhere = anywhere(ctx, t);
    return absent(span, elsewhere.length ? elsewhere : null);
  }

  const segments = t.replace(/^\.\//, '').replace(/\/$/, '').split('/');
  const first = segments[0] ?? '';
  // "`references/pitfalls.md`" may be relative to some other folder the sentence names.
  const elsewhere = anywhere(ctx, t);
  if (elsewhere.length) {
    if (segments.length === 1 && !t.endsWith('/')) return verified(span, 'definition', elsewhere.slice(0, 3).map((f) => ({ ref: f, level: 'definition' })), `found at ${shown(elsewhere)}`);
    return verified(span, 'definition', elsewhere.slice(0, 3).map((f) => ({ ref: f, level: 'definition' })), `found at ${shown(elsewhere)}, not relative to ${ctx.docFile}`);
  }
  if (segments.length === 1 && !t.endsWith('/')) {
    // `channels.json` read from a CDN, `config.yaml` written at runtime: named by the code, not stored in the repository.
    const named = stringInCode(ctx, t);
    if (named) return verified(span, 'reference', [named], `not a file in the repository; the code names it at ${named.ref}`);
    return unconfirmed(span, `no file named ${first} in the repository`);
  }
  // `lodash/fp`: an import path into a declared package.
  const pkg = ctx.repo.packages.find((p) => first in p.deps);
  if (pkg) return verified(span, 'declaration', [{ ref: `${pkg.file} ${first}`, level: 'declaration' }], `an import path into ${first}, which ${pkg.file} declares`);
  // A missing leaf under a folder that exists means something moved or was deleted.
  const anchored = segments.length === 1 || candidates.some((b) => ctx.repo.exists(join(b, first)));
  if (anchored) return stale(span, `not found: ${join(primary, t)}`);
  // `src/services/` when the repository has `backend/src/` but no services folder under any `src/`.
  const homes = /^[\w-]+$/.test(first) ? [...ctx.repo.dirs].filter((d) => posix.basename(d) === first) : [];
  if (homes.length) return stale(span, `not found: no ${segments.slice(1).join('/')} under any ${first}/ folder (${shown(homes)})`);
  // `helm install/upgrade`, `prettier/prettier`: wording or a rule id, not a repository path.
  if (/^@?[a-z][\w-]*\/[a-z][\w-]*$/.test(t)) return notChecked(span, `reads as "${t.replace('/', ' or ')}" or a rule id, not a path`);
  return unconfirmed(span, `no ${first}/ in this repository; fine if it names a folder somewhere else`);
}

/** A markdown link: relative to the document, confined to the repository. */
export function checkLink(ctx: CheckContext, span: Span): SpanResult {
  const t = span.text.trim();
  if (t.startsWith('/') || t.startsWith('~')) return notChecked(span, 'outside the repository');
  const rel = ctx.repo.rel(t, ctx.docDir);
  if (rel === null) return notChecked(span, 'links outside the repository');
  const ignoredBy = ctx.repo.ignored(rel);
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: generated output`);
  if (ctx.repo.exists(rel)) return span.expect === 'absent' ? absent(span, [rel]) : verified(span, 'definition', [{ ref: rel, level: 'definition' }], rel);
  return span.expect === 'absent' ? absent(span, null) : stale(span, `broken link: ${rel} does not exist`);
}

/** An `@path` import: relative to the importing file, absolute and `~` allowed. */
export function checkImport(ctx: CheckContext, span: Span): SpanResult {
  const t = span.text.trim();
  const abs = t.startsWith('~/') ? joinFs(homedir(), t.slice(2)) : isAbsolute(t) ? t : null;
  if (abs) return notChecked(span, existsSync(abs) ? 'imports a file outside the repository (exists on this machine)' : 'imports a file outside the repository (not on this machine)');
  const rel = ctx.repo.rel(t, ctx.docDir);
  if (rel === null) return notChecked(span, 'imports a file outside the repository');
  if (ctx.repo.exists(rel)) return verified(span, 'definition', [{ ref: rel, level: 'definition' }], `imports ${rel}`);
  // `@mui/material` in prose names a package, not a file to import.
  if (/^[\w.-]+\/[\w.-]+$/.test(t) && ctx.repo.packages.some((p) => `@${t}` in p.deps)) return notChecked(span, `names the package @${t}, not a file`);
  if (!posix.extname(t) && ctx.repo.exists(`${rel}.md`)) return unconfirmed(span, `no file ${rel}; ${rel}.md exists, but Claude Code imports the path as written`, [{ ref: `${rel}.md`, level: 'reference' }], 'reference');
  return stale(span, `broken import: ${rel} does not exist`);
}

/**
 * A rule's `paths:` glob, read the way Claude Code reads it, relative to the folder that holds `.claude/`
 * (or `.cursor/`, `.github/`). A glob matching nothing is stale: the rule never loads.
 */
export function checkGlob(ctx: CheckContext, span: Span): SpanResult {
  const base = ctx.pathBase;
  const { files, error } = matchGlob(span.text, ctx.repo.files, base);
  if (files.length) return verified(span, 'definition', files.slice(0, 3).map((f) => ({ ref: f, level: 'definition' })), `matches ${shown(files)}`);
  if (error) return stale(span, error);
  // `pages/[slug]/*.tsx` is a bracket expression: one of s, l, u, g. The folder itself needs `\[slug\]`.
  if (/\[[^\]]+\]/.test(span.text)) {
    const literal = matchGlob(span.text.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), ctx.repo.files, base);
    if (literal.files.length) return stale(span, `matches no file: Claude Code reads ${span.text.match(/\[[^\]]+\]/)?.[0]} as a bracket expression; write it as ${span.text.replace(/\[/g, '\\[').replace(/\]/g, '\\]')} to match ${shown(literal.files)}`);
  }
  return stale(span, `${NO_MATCH}${base ? ` under ${base}/` : ''}`);
}

/** The reason of a glob that is valid but matches no file today. */
export const NO_MATCH = 'matches no file, so this pattern never loads the rule';
