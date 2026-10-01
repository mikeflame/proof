import type { Evidence, Span, SpanResult } from '../model.ts';
import { DEPENDENCY_ALIASES } from '../parse/aliases.ts';
import { declaredDependencies, nameMatches } from './manifests.ts';
import { blocked, type CheckContext, notChecked, stale, unconfirmed, verified } from './util.ts';

type Version = number[];

interface Source {
  where: string;
  version: Version;
  /** A floor says "at least" (engines, requires-python, go.mod); a runtime says what actually runs (Docker, CI). */
  floor: boolean;
}

/** The first version a range admits: ">=26.0.0" gives [26, 0, 0], "^22.18" gives [22, 18], "3.12.x" gives [3, 12]. */
export function lowerBound(range: string): Version | null {
  const r = range.trim().replace(/^v/, '');
  if (!r || r === '*' || r === 'latest' || /^(lts|stable|nightly|beta)/.test(r)) return null;
  const parts = r.split('||').map((alt) => alt.trim().match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/)).filter(Boolean) as RegExpMatchArray[];
  const versions = parts.map((m) => [m[1], m[2], m[3]].filter((x): x is string => x !== undefined && /^\d+$/.test(x)).map(Number));
  if (!versions.length) return null;
  return versions.reduce((lo, v) => (compare(v, lo) < 0 ? v : lo));
}

function compare(a: Version, b: Version, depth = Math.max(a.length, b.length)): number {
  for (let i = 0; i < depth; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

const show = (v: Version) => v.join('.');

function nodeSources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  for (const p of ctx.repo.packages) {
    const lb = p.engines.node ? lowerBound(p.engines.node) : null;
    if (lb) out.push({ where: `${p.file} engines.node "${p.engines.node}"`, version: lb, floor: true });
  }
  for (const f of ['.nvmrc', '.node-version']) {
    const v = ctx.repo.read(f)?.trim();
    const lb = v ? lowerBound(v) : null;
    if (lb && v) out.push({ where: `${f} ${v}`, version: lb, floor: true });
  }
  out.push(...toolVersions(ctx, /^(nodejs|node)\s+(\S+)/m, 'node'));
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?node:(\d+(?:\.\d+)*)/gim, 'FROM node'));
  out.push(...ciMatrix(ctx, 'node-version'));
  return out;
}

function toolVersions(ctx: CheckContext, re: RegExp, tool: string): Source[] {
  const out: Source[] = [];
  const tv = ctx.repo.read('.tool-versions');
  const m = tv?.match(re);
  const lb = m?.[2] ? lowerBound(m[2]) : null;
  if (lb) out.push({ where: `.tool-versions ${m?.[0]}`, version: lb, floor: true });
  for (const f of ['mise.toml', '.mise.toml']) {
    const data = ctx.repo.structured(f) as { tools?: Record<string, unknown> } | null;
    const v = data?.tools?.[tool];
    const spec = typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : typeof v === 'object' && v ? String((v as { version?: string }).version ?? '') : '';
    const lbm = spec ? lowerBound(spec) : null;
    if (lbm) out.push({ where: `${f} tools.${tool} "${spec}"`, version: lbm, floor: true });
  }
  return out;
}

function dockerImages(ctx: CheckContext, re: RegExp, label: string): Source[] {
  const out: Source[] = [];
  for (const f of ctx.repo.find(/(^|\/)(Dockerfile[\w.-]*|[\w.-]*\.Dockerfile)$/)) {
    for (const m of (ctx.repo.read(f) ?? '').matchAll(re)) {
      const lb = m[1] ? lowerBound(m[1]) : null;
      if (lb) out.push({ where: `${f} ${label}:${m[1]}`, version: lb, floor: false });
    }
  }
  return out;
}

function composeImages(ctx: CheckContext, names: RegExp): Source[] {
  const out: Source[] = [];
  for (const f of [...ctx.repo.find(/(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/), ...ctx.repo.find(/(^|\/)(Dockerfile[\w.-]*)$/)]) {
    for (const m of (ctx.repo.read(f) ?? '').matchAll(/(?:image:|FROM)\s*["']?((?:[\w.-]+\/)*([\w.-]+)):(\d+(?:\.\d+)*)/gi)) {
      if (!names.test(m[2] ?? '') && !names.test(m[1] ?? '')) continue;
      const lb = m[3] ? lowerBound(m[3]) : null;
      if (lb) out.push({ where: `${f} ${m[1]}:${m[3]}`, version: lb, floor: false });
    }
  }
  return out;
}

function ciMatrix(ctx: CheckContext, key: string): Source[] {
  const out: Source[] = [];
  for (const f of ctx.repo.find(/^\.github\/workflows\/[^/]+\.ya?ml$|^\.gitlab-ci\.ya?ml$|^\.circleci\/config\.ya?ml$/)) {
    const text = ctx.repo.read(f) ?? '';
    for (const m of text.matchAll(new RegExp(`${key}\\s*:\\s*\\[?([^\\]\\n]+)\\]?`, 'g'))) {
      for (const v of (m[1] ?? '').split(',').map((x) => x.trim().replace(/^["']|["']$/g, ''))) {
        const lb = /^\d/.test(v) ? lowerBound(v) : null;
        if (lb) out.push({ where: `${f} ${key}: ${v}`, version: lb, floor: false });
      }
    }
  }
  return out;
}

function pythonSources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  for (const f of ctx.repo.find(/(^|\/)pyproject\.toml$/)) {
    const data = ctx.repo.structured(f) as Record<string, any> | null;
    const spec = data?.project?.['requires-python'] ?? data?.tool?.poetry?.dependencies?.python;
    const lb = typeof spec === 'string' ? lowerBound(spec) : null;
    if (lb) out.push({ where: `${f} requires-python "${spec}"`, version: lb, floor: true });
  }
  const pv = ctx.repo.read('.python-version')?.trim().split('\n')[0];
  const lb = pv ? lowerBound(pv) : null;
  if (lb && pv) out.push({ where: `.python-version ${pv}`, version: lb, floor: true });
  out.push(...toolVersions(ctx, /^(python)\s+(\S+)/m, 'python'));
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?python:(\d+(?:\.\d+)*)/gim, 'FROM python'));
  out.push(...ciMatrix(ctx, 'python-version'));
  return out;
}

function goSources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  for (const f of ctx.repo.find(/(^|\/)go\.mod$/)) {
    const text = ctx.repo.read(f) ?? '';
    const go = text.match(/^go\s+(\d+(?:\.\d+)*)/m);
    if (go?.[1]) out.push({ where: `${f} go ${go[1]}`, version: lowerBound(go[1]) ?? [], floor: true });
    const tc = text.match(/^toolchain\s+go(\d+(?:\.\d+)*)/m);
    if (tc?.[1]) out.push({ where: `${f} toolchain go${tc[1]}`, version: lowerBound(tc[1]) ?? [], floor: false });
  }
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?golang:(\d+(?:\.\d+)*)/gim, 'FROM golang'));
  out.push(...ciMatrix(ctx, 'go-version'));
  return out;
}

function rustSources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  for (const f of ['rust-toolchain', 'rust-toolchain.toml']) {
    const text = ctx.repo.read(f);
    const m = text?.match(/(?:channel\s*=\s*["'])?(\d+\.\d+(?:\.\d+)?)/);
    if (m?.[1]) out.push({ where: `${f} ${m[1]}`, version: lowerBound(m[1]) ?? [], floor: true });
  }
  for (const f of ctx.repo.find(/(^|\/)Cargo\.toml$/)) {
    const data = ctx.repo.structured(f) as Record<string, any> | null;
    const rv = data?.package?.['rust-version'] ?? data?.workspace?.package?.['rust-version'];
    if (typeof rv === 'string') out.push({ where: `${f} rust-version "${rv}"`, version: lowerBound(rv) ?? [], floor: true });
  }
  return out;
}

function rubySources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  const rv = ctx.repo.read('.ruby-version')?.trim();
  if (rv && lowerBound(rv)) out.push({ where: `.ruby-version ${rv}`, version: lowerBound(rv) ?? [], floor: true });
  const gem = ctx.repo.read('Gemfile')?.match(/^\s*ruby\s+["']([^"']+)["']/m);
  if (gem?.[1] && lowerBound(gem[1])) out.push({ where: `Gemfile ruby "${gem[1]}"`, version: lowerBound(gem[1]) ?? [], floor: true });
  out.push(...toolVersions(ctx, /^(ruby)\s+(\S+)/m, 'ruby'));
  return out;
}

function phpSources(ctx: CheckContext): Source[] {
  const out: Source[] = [];
  for (const f of ctx.repo.find(/(^|\/)composer\.json$/)) {
    const spec = (ctx.repo.structured(f) as { require?: Record<string, string> } | null)?.require?.php;
    if (spec && lowerBound(spec)) out.push({ where: `${f} require.php "${spec}"`, version: lowerBound(spec) ?? [], floor: true });
  }
  return out;
}

function packageManagerSources(ctx: CheckContext, tool: string): Source[] {
  const out: Source[] = [];
  for (const p of ctx.repo.packages) {
    const engine = p.engines[tool];
    if (engine && lowerBound(engine)) out.push({ where: `${p.file} engines.${tool} "${engine}"`, version: lowerBound(engine) ?? [], floor: true });
  }
  for (const p of ctx.repo.packages) {
    const raw = ctx.repo.read(p.file) ?? '';
    const m = raw.match(new RegExp(`"packageManager"\\s*:\\s*"${tool}@(\\d+(?:\\.\\d+)*)`));
    if (m?.[1]) out.push({ where: `${p.file} packageManager ${tool}@${m[1]}`, version: lowerBound(m[1]) ?? [], floor: false });
  }
  return out;
}

function packageSources(ctx: CheckContext, tech: string): Source[] | null {
  const alias = DEPENDENCY_ALIASES.find((a) => a.name.toLowerCase() === tech || a.name.toLowerCase().replace(/\.js$/, '') === tech.replace(/\.js$/, '') || a.pattern.test(tech));
  if (!alias) return null;
  const decl = declaredDependencies(ctx.repo).filter((d) => (alias[d.ecosystem] ?? []).some((e) => nameMatches(d.name, e)));
  return decl.flatMap((d) => {
    const lb = lowerBound(d.spec);
    return lb ? [{ where: `${d.file} ${d.name} "${d.spec}"`, version: lb, floor: true }] : [];
  });
}

const TECH_KEY: Record<string, string> = { 'node.js': 'node', golang: 'go', postgres: 'postgresql', 'material ui': 'mui', 'express.js': 'express', tailwindcss: 'tailwind', valkey: 'redis' };

/** "Node 24+", "Python 3.12", "PostgreSQL 18": compared against the strictest floor the repository declares. */
export function checkVersion(ctx: CheckContext, span: Span): SpanResult {
  const m = span.text.match(/^(.+?)\s*(?:v|version\s+)?(>=|≥|\^|~)?\s*(\d+(?:\.\d+){0,2})(\.x|\+)?$/);
  if (!m) return notChecked(span, 'not a version claim');
  const raw = (m[1] ?? '').trim().toLowerCase();
  const tech = TECH_KEY[raw] ?? raw;
  const claim = (m[3] ?? '').split('.').map(Number);
  const atLeast = Boolean(m[2] && m[2] !== '~') || m[4] === '+';
  const depth = claim.length;

  const sources: Source[] | null =
    tech === 'node' ? nodeSources(ctx)
    : tech === 'python' ? pythonSources(ctx)
    : tech === 'go' ? goSources(ctx)
    : tech === 'rust' ? rustSources(ctx)
    : tech === 'ruby' ? rubySources(ctx)
    : tech === 'php' ? phpSources(ctx)
    : tech === 'postgresql' ? composeImages(ctx, /^(postgres|postgis|postgresql|pgvector|timescaledb[\w-]*)$/)
    : tech === 'redis' ? composeImages(ctx, /^(redis|valkey|redis-stack[\w-]*)$/)
    : tech === 'mysql' ? composeImages(ctx, /^(mysql|mariadb)$/)
    : tech === 'mongodb' ? composeImages(ctx, /^(mongo|mongodb)$/)
    : tech === 'elasticsearch' ? composeImages(ctx, /^(elasticsearch)$/)
    : tech === 'kafka' ? composeImages(ctx, /^(kafka|cp-kafka)$/)
    : tech === 'pnpm' || tech === 'yarn' || tech === 'npm' ? packageManagerSources(ctx, tech)
    : packageSources(ctx, tech);
  if (sources === null) return blocked(span, `no rule reads ${m[1]} versions yet`);
  if (!sources.length) return unconfirmed(span, `nothing in the repository pins a ${m[1]} version`);

  const evidence: Evidence[] = sources.slice(0, 4).map((s) => ({ ref: s.where, level: 'declaration' }));
  if (atLeast) {
    const floors = sources.filter((s) => s.floor);
    const pool = floors.length ? floors : sources;
    const strictest = pool.reduce((hi, s) => (compare(s.version, hi.version, depth) > 0 ? s : hi));
    const cmp = compare(strictest.version, claim, depth);
    if (cmp === 0) return verified(span, 'declaration', evidence, `the strictest floor is ${show(strictest.version.slice(0, depth))}: ${strictest.where}`);
    if (cmp > 0) return stale(span, `the repository requires ${m[1]} ${show(strictest.version.slice(0, depth))}: ${strictest.where}`, pool.filter((s) => compare(s.version, claim, depth) > 0).slice(0, 4).map((s) => ({ ref: s.where, level: 'declaration' })));
    return unconfirmed(span, `the repository allows ${m[1]} ${show(strictest.version.slice(0, depth))} (${strictest.where}); the claim is stricter than its config`, evidence, 'declaration');
  }
  const equal = sources.filter((s) => compare(s.version, claim, depth) === 0);
  if (equal.length === sources.length) return verified(span, 'declaration', evidence, sources.map((s) => s.where).slice(0, 3).join('; '));
  if (!equal.length) return stale(span, `the repository uses ${sources.map((s) => s.where).slice(0, 4).join('; ')}`, evidence);
  return unconfirmed(span, `versions disagree: ${sources.map((s) => s.where).slice(0, 4).join('; ')}`, evidence, 'declaration');
}
