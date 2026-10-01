import type { RepoContext } from '../core/repo.ts';

/** A dependency some manifest declares: ecosystem, name, version spec and the file that says so. */
export interface Declared {
  ecosystem: 'npm' | 'pypi' | 'go' | 'cargo' | 'gem' | 'composer' | 'maven' | 'nuget';
  name: string;
  spec: string;
  file: string;
}

const cache = new WeakMap<RepoContext, Declared[]>();

const pep508Name = (req: string): string => (req.trim().match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/)?.[1] ?? '').toLowerCase();
const pep508Spec = (req: string): string => req.trim().replace(/^[A-Za-z0-9][A-Za-z0-9._-]*(\[[^\]]*\])?/, '').split(';')[0]?.trim() ?? '';

/** Every dependency any manifest of any ecosystem declares. Unparseable manifests are degradations, not crashes. */
export function declaredDependencies(repo: RepoContext): Declared[] {
  const hit = cache.get(repo);
  if (hit) return hit;
  const out: Declared[] = [];
  for (const p of repo.packages) for (const [name, spec] of Object.entries(p.deps)) out.push({ ecosystem: 'npm', name, spec: String(spec), file: p.file });

  for (const file of repo.find(/(^|\/)pyproject\.toml$/)) {
    const data = repo.structured(file) as Record<string, any> | null;
    if (!data) continue;
    const reqs: string[] = [...(data.project?.dependencies ?? []), ...Object.values<string[]>(data.project?.['optional-dependencies'] ?? {}).flat(), ...Object.values<string[]>(data['dependency-groups'] ?? {}).flat().filter((x) => typeof x === 'string')];
    for (const r of reqs) out.push({ ecosystem: 'pypi', name: pep508Name(r), spec: pep508Spec(r), file });
    for (const [name, spec] of Object.entries<any>({ ...data.tool?.poetry?.dependencies, ...data.tool?.poetry?.['dev-dependencies'], ...Object.assign({}, ...Object.values<any>(data.tool?.poetry?.group ?? {}).map((g) => g?.dependencies ?? {})) })) {
      out.push({ ecosystem: 'pypi', name: name.toLowerCase(), spec: typeof spec === 'string' ? spec : String(spec?.version ?? ''), file });
    }
  }
  for (const file of repo.find(/(^|\/)requirements[\w.-]*\.(txt|in)$/)) {
    for (const line of (repo.read(file) ?? '').split('\n')) {
      const l = line.split('#')[0]?.trim() ?? '';
      if (!l || l.startsWith('-')) continue;
      out.push({ ecosystem: 'pypi', name: pep508Name(l), spec: pep508Spec(l), file });
    }
  }
  for (const file of repo.find(/(^|\/)setup\.py$/)) {
    const m = (repo.read(file) ?? '').match(/install_requires\s*=\s*\[([^\]]*)\]/s);
    for (const r of m?.[1]?.match(/["']([^"']+)["']/g) ?? []) out.push({ ecosystem: 'pypi', name: pep508Name(r.slice(1, -1)), spec: pep508Spec(r.slice(1, -1)), file });
  }
  for (const file of repo.find(/(^|\/)go\.mod$/)) {
    for (const m of (repo.read(file) ?? '').matchAll(/^\s*(?:require\s+)?([\w.-]+\.[\w./-]+)\s+(v[\w.+-]+)/gm)) out.push({ ecosystem: 'go', name: m[1] ?? '', spec: m[2] ?? '', file });
  }
  for (const file of repo.find(/(^|\/)Cargo\.toml$/)) {
    const data = repo.structured(file) as Record<string, any> | null;
    if (!data) continue;
    for (const section of [data.dependencies, data['dev-dependencies'], data['build-dependencies'], data.workspace?.dependencies]) {
      for (const [name, spec] of Object.entries<any>(section ?? {})) out.push({ ecosystem: 'cargo', name, spec: typeof spec === 'string' ? spec : String(spec?.version ?? ''), file });
    }
  }
  for (const file of repo.find(/(^|\/)Gemfile$/)) {
    for (const m of (repo.read(file) ?? '').matchAll(/^\s*gem\s+["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?/gm)) out.push({ ecosystem: 'gem', name: m[1] ?? '', spec: m[2] ?? '', file });
  }
  for (const file of repo.find(/(^|\/)composer\.json$/)) {
    const data = repo.structured(file) as Record<string, any> | null;
    for (const [name, spec] of Object.entries<any>({ ...data?.require, ...data?.['require-dev'] })) out.push({ ecosystem: 'composer', name, spec: String(spec), file });
  }
  for (const file of repo.find(/(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/)) {
    for (const m of (repo.read(file) ?? '').matchAll(/<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>|["']([\w.-]+):([\w.-]+)(?::([\w.+-]+))?["']/g)) {
      const group = m[1] ?? m[3];
      const artifact = m[2] ?? m[4];
      if (group && artifact) out.push({ ecosystem: 'maven', name: `${group}:${artifact}`, spec: m[5] ?? '', file });
    }
  }
  for (const file of repo.find(/\.(csproj|fsproj)$/)) {
    for (const m of (repo.read(file) ?? '').matchAll(/<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/g)) out.push({ ecosystem: 'nuget', name: m[1] ?? '', spec: m[2] ?? '', file });
  }
  cache.set(repo, out);
  return out;
}

/** Does a declared name match an alias entry? Entries ending in `/`, `-` or `*` match by prefix. */
export function nameMatches(declared: string, entry: string): boolean {
  if (/[/*-]$/.test(entry)) return declared.toLowerCase().startsWith(entry.replace(/\*$/, '').toLowerCase());
  return declared.toLowerCase() === entry.toLowerCase();
}
