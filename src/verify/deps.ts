import type { Span, SpanResult } from '../model.ts';
import { DEPENDENCY_ALIASES } from '../parse/aliases.ts';
import { declaredDependencies, nameMatches } from './manifests.ts';
import { blocked, type CheckContext, notChecked, stale, unconfirmed, verified } from './util.ts';

/** A product named in prose ("Stripe"): some manifest must declare one of its packages, or some file must prove it. */
export function checkDependency(ctx: CheckContext, span: Span): SpanResult {
  const alias = DEPENDENCY_ALIASES.find((a) => a.name === span.text);
  if (!alias && /^@[\w.-]+\/([\w.-]+|\*)$/.test(span.text)) return checkPackage(ctx, span);
  if (!alias) return blocked(span, `no alias rule for ${span.text}`);
  const declared = declaredDependencies(ctx.repo).filter((d) => (alias[d.ecosystem] ?? []).some((e) => nameMatches(d.name, e)));
  const files = [...(alias.files ?? []).flatMap((re) => ctx.repo.files.filter((f) => re.test(f))), ...contentMatches(ctx, alias.content)].slice(0, 3);
  const found = declared.length > 0 || files.length > 0;
  if (span.expect === 'absent') {
    if (!found) return verified(span, 'declaration', [{ ref: `no manifest declares ${span.text}`, level: 'declaration' }], 'absent, as the statement says');
    const first = declared[0];
    return stale(span, `said to be gone, but ${first ? `${first.file} still depends on ${first.name}` : `${files[0]} still exists`}`, first ? [{ ref: `${first.file} ${first.name} "${first.spec}"`, level: 'declaration' }] : files.map((f) => ({ ref: f, level: 'definition' })));
  }
  if (declared.length) {
    const shown = declared.slice(0, 3).map((d) => ({ ref: `${d.file} ${d.name}${d.spec ? ` "${d.spec}"` : ''}`, level: 'declaration' as const }));
    return verified(span, 'declaration', shown, `${declared[0]?.file} depends on ${declared[0]?.name}`);
  }
  if (files.length) return verified(span, 'definition', files.map((f) => ({ ref: f, level: 'definition' })), `${files[0]} proves ${span.text} is used`);
  const ecosystems = (['npm', 'pypi', 'go', 'cargo', 'gem', 'composer', 'maven', 'nuget'] as const).filter((e) => alias[e]?.length);
  return unconfirmed(span, `no manifest declares ${span.text} (checked ${ecosystems.join(', ') || 'files'}); fine if it names an external service`);
}

/** Files whose text proves use (a YAML file with `apiVersion:` and `kind:` is a Kubernetes manifest). */
function contentMatches(ctx: CheckContext, rule: { files: RegExp; pattern: RegExp } | undefined): string[] {
  if (!rule) return [];
  const out: string[] = [];
  for (const f of ctx.repo.find(rule.files).slice(0, 500)) {
    if (rule.pattern.test(ctx.repo.read(f) ?? '')) out.push(f);
    if (out.length >= 3) break;
  }
  return out;
}

/** `@mui/material`, `@material-ui/*`: an npm package some package.json must declare. */
function checkPackage(ctx: CheckContext, span: Span): SpanResult {
  const want = span.text;
  const prefix = want.endsWith('/*') ? want.slice(0, -1) : null;
  const declared = declaredDependencies(ctx.repo).filter((d) => d.ecosystem === 'npm' && (prefix ? d.name.startsWith(prefix) : d.name === want));
  const first = declared[0];
  if (span.expect === 'absent') {
    return first ? unconfirmed(span, `said to be gone, but ${first.file} still depends on ${first.name}`, [{ ref: `${first.file} ${first.name}`, level: 'declaration' }], 'declaration') : verified(span, 'declaration', [{ ref: `no package.json declares ${want}`, level: 'declaration' }], 'absent, as the statement says');
  }
  if (first) return verified(span, 'declaration', declared.slice(0, 2).map((d) => ({ ref: `${d.file} ${d.name} "${d.spec}"`, level: 'declaration' })), `${first.file} depends on ${first.name}`);
  return unconfirmed(span, `no package.json declares ${want}`);
}
