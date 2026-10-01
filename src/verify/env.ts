import { gitGrep } from '../core/git.ts';
import type { Span, SpanResult } from '../model.ts';
import { blocked, type CheckContext, clip, docExclude, notChecked, unconfirmed, verified } from './util.ts';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * `MODE=queue`: the value must appear in the same declaration or the same assignment as the name,
 * never just somewhere in the same file.
 */
export function checkEnv(ctx: CheckContext, span: Span): SpanResult {
  if (!ctx.repo.isGit) return blocked(span, 'lookups need a git repository');
  const eq = span.text.indexOf('=');
  const key = span.text.slice(0, eq);
  const value = span.text.slice(eq + 1).replace(/^["']|["']$/g, '');
  if (!key || !value) return notChecked(span, 'not an assignment');
  const res = gitGrep(ctx.repo.root, key, { word: true, pathspec: ['.', ':(exclude,glob)**/*.md', ...ctx.repo.generatedExcludes, ...docExclude(ctx)], limit: 2000 });
  if (res.status === 'error') return blocked(span, `lookup failed: ${res.message}`);
  if (res.status === 'miss') return unconfirmed(span, `${key} appears nowhere in the repository`);
  const k = esc(key);
  const v = esc(value);
  const declaration = [
    new RegExp(`(^|[\\s"'-])${k}\\s*=\\s*["']?${v}["']?(\\s|$|[;,#])`), // .env, shell, Dockerfile ENV K=v, compose list
    new RegExp(`(^|\\s|["'])${k}["']?\\s*:\\s*["']?${v}["']?\\s*(#.*)?$`), // YAML map
    new RegExp(`^\\s*ENV\\s+${k}\\s+["']?${v}["']?\\s*$`), // Dockerfile ENV K v
  ];
  const comparison = new RegExp(`${k}["'\\]\\)]*\\s*(===?|!==?|==|!=)\\s*["'\`]${v}["'\`]|["'\`]${v}["'\`]\\s*(===?|!==?|==|!=)\\s*[\\w.$\\[\\]"'(]*${k}`);
  for (const hit of res.lines) {
    if (declaration.some((re) => re.test(hit.text))) return verified(span, 'declaration', [{ ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: 'declaration' }], `declared at ${hit.file}:${hit.line}`);
  }
  for (const hit of res.lines) {
    if (comparison.test(hit.text)) return verified(span, 'definition', [{ ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: 'definition' }], `read and compared to "${value}" at ${hit.file}:${hit.line}`);
  }
  const first = res.lines[0];
  return unconfirmed(span, `${key} is used${first ? ` (${first.file}:${first.line})` : ''}, but never set to or compared with "${value}"`, first ? [{ ref: `${first.file}:${first.line}`, excerpt: clip(first.text), level: 'reference' }] : [], 'reference');
}
