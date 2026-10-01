import { existsSync, readdirSync, readFileSync, statSync, type Dirent } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, posix, relative, resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';
import { gitAvailable, ignoredPaths, listFiles, repoRoot } from './git.ts';

/** A check that could not run fully, named in the report header. Spec 3.3, D4. */
export interface Degradation {
  subject: string;
  reason: string;
}

export interface NodePackage {
  dir: string;
  file: string;
  name: string | null;
  scripts: Record<string, string>;
  deps: Record<string, string>;
  engines: Record<string, string>;
  workspaces: string[];
}

const SKIP_DIRS = /(^|\/)(node_modules|\.git|dist|build|out|target|vendor|\.next|\.venv|venv|__pycache__|\.proof)(\/|$)/;

/** Everything the checks read about one repository, loaded lazily and cached for the run. */
export class RepoContext {
  readonly root: string;
  readonly isGit: boolean;
  readonly degraded: Degradation[] = [];
  private fileList: string[] | null = null;
  private dirList: Set<string> | null = null;
  private texts = new Map<string, string | null>();
  private lineCache = new Map<string, string[]>();
  private ignoreCache = new Map<string, boolean>();
  private pkgs: NodePackage[] | null = null;
  private broken = new Map<string, string>();
  private parsed = new Map<string, unknown>();
  private generated: string[] | null = null;

  constructor(cwd: string) {
    const git = gitAvailable() ? repoRoot(cwd) : null;
    this.root = git ?? resolve(cwd);
    this.isGit = Boolean(git);
    if (!gitAvailable()) this.degrade('git', 'git is not installed: no ignore rules, no identifier lookups, no history');
    else if (!git) this.degrade('git', `${this.root} is not a git repository: no ignore rules, identifier lookups or history`);
  }

  degrade(subject: string, reason: string): void {
    if (!this.degraded.some((d) => d.subject === subject && d.reason === reason)) this.degraded.push({ subject, reason });
  }

  /** Tracked and untracked files git does not ignore (or a filesystem walk outside git). */
  get files(): string[] {
    if (!this.fileList) {
      this.fileList = this.isGit ? listFiles(this.root) : walk(this.root);
    }
    return this.fileList;
  }

  get dirs(): Set<string> {
    if (!this.dirList) {
      const dirs = new Set<string>();
      for (const f of this.files) for (let d = posix.dirname(f); d !== '.' && !dirs.has(d); d = posix.dirname(d)) dirs.add(d);
      this.dirList = dirs;
    }
    return this.dirList;
  }

  /** Repository-relative path, or null when it leaves the repository. */
  rel(path: string, base = ''): string | null {
    const abs = path.startsWith('~/') ? join(homedir(), path.slice(2)) : isAbsolute(path) ? path : resolve(this.root, base, path);
    const r = relative(this.root, abs).split('\\').join('/');
    if (r.startsWith('..') || isAbsolute(r)) return null;
    return r;
  }

  exists(rel: string): boolean {
    return existsSync(join(this.root, rel));
  }

  isDir(rel: string): boolean {
    try {
      return statSync(join(this.root, rel)).isDirectory();
    } catch {
      return false;
    }
  }

  /** The file split into lines, cached. */
  lines(rel: string): string[] {
    let out = this.lineCache.get(rel);
    if (!out) {
      out = (this.read(rel) ?? '').split('\n');
      this.lineCache.set(rel, out);
    }
    return out;
  }

  /** A file's text by repository-relative path, or by absolute path for files outside it (user instructions). */
  read(rel: string): string | null {
    if (!this.texts.has(rel)) {
      try {
        this.texts.set(rel, readFileSync(isAbsolute(rel) ? rel : join(this.root, rel), 'utf8'));
      } catch {
        this.texts.set(rel, null);
      }
    }
    return this.texts.get(rel) ?? null;
  }

  /**
   * Whether git ignores `rel`, or any folder above it. Folders are queried with a trailing slash so
   * directory-only patterns (`bin/`) match even when the folder does not exist.
   */
  ignored(rel: string): string | null {
    if (!this.isGit) return null;
    const clean = rel.replace(/\/$/, '');
    const parts = clean.split('/');
    const queries = parts.map((_, i) => parts.slice(0, i + 1).join('/')).flatMap((p, i) => (i < parts.length - 1 || rel.endsWith('/') ? [`${p}/`] : [p, `${p}/`]));
    this.lookupIgnored(queries.filter((q) => !this.ignoreCache.has(q)));
    return queries.find((q) => this.ignoreCache.get(q)) ?? null;
  }

  /** Warm the ignore cache for many paths with one git process. */
  primeIgnored(rels: string[]): void {
    if (!this.isGit) return;
    const queries = new Set<string>();
    for (const rel of rels) {
      const parts = rel.replace(/\/$/, '').split('/');
      parts.forEach((_, i) => {
        const p = parts.slice(0, i + 1).join('/');
        queries.add(`${p}/`);
        if (i === parts.length - 1) queries.add(p);
      });
    }
    this.lookupIgnored([...queries].filter((q) => !this.ignoreCache.has(q)));
  }

  private lookupIgnored(all: string[]): void {
    // git check-ignore rejects the whole batch when one path leaves the repository.
    const queries = all.filter((q) => {
      const n = posix.normalize(q);
      const inside = q !== '' && !isAbsolute(q) && !q.startsWith('~') && n !== '..' && !n.startsWith('../');
      if (!inside) this.ignoreCache.set(q, false);
      return inside;
    });
    if (!queries.length) return;
    const hits = ignoredPaths(this.root, queries);
    if (!hits) this.degrade('git check-ignore', 'failed; ignored output may be reported as missing');
    for (const q of queries) this.ignoreCache.set(q, hits?.has(q) ?? false);
  }

  /** Every package.json in the repository. One that does not parse is a degradation, never a crash. */
  get packages(): NodePackage[] {
    if (!this.pkgs) {
      this.pkgs = [];
      for (const file of this.files.filter((f) => /(^|\/)package\.json$/.test(f) && !SKIP_DIRS.test(f))) {
        const text = this.read(file);
        if (text === null) continue;
        try {
          const json = JSON.parse(text) as Record<string, unknown>;
          const rec = (v: unknown): Record<string, string> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {});
          const ws = json.workspaces;
          this.pkgs.push({
            dir: posix.dirname(file) === '.' ? '' : posix.dirname(file),
            file,
            name: typeof json.name === 'string' ? json.name : null,
            scripts: rec(json.scripts),
            deps: { ...rec(json.peerDependencies), ...rec(json.optionalDependencies), ...rec(json.devDependencies), ...rec(json.dependencies) },
            engines: rec(json.engines),
            workspaces: Array.isArray(ws) ? ws.map(String) : Array.isArray((ws as { packages?: unknown })?.packages) ? ((ws as { packages: unknown[] }).packages.map(String)) : [],
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message.split('\n')[0] ?? 'invalid JSON' : String(err);
          this.broken.set(file, reason);
          this.degrade(file, `does not parse (${reason}); its scripts, dependencies and engines are not checked`);
        }
      }
    }
    return this.pkgs;
  }

  /** The parse error of a manifest that failed, or null. */
  brokenManifest(file: string): string | null {
    void this.packages;
    return this.broken.get(file) ?? null;
  }

  /** Folders that hold a package manifest of any ecosystem, used to resolve paths written relative to a sub-project. */
  get projectDirs(): string[] {
    const manifests = /(^|\/)(package\.json|pyproject\.toml|go\.mod|Cargo\.toml|Gemfile|composer\.json|pom\.xml|build\.gradle(\.kts)?|setup\.py|requirements\.txt|mix\.exs|deno\.json)$/;
    const dirs = new Set<string>();
    for (const f of this.files) if (manifests.test(f) && !SKIP_DIRS.test(f) && f.includes('/')) dirs.add(posix.dirname(f));
    for (const f of this.badManifestDirs()) dirs.add(f);
    return [...dirs].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
  }

  private badManifestDirs(): string[] {
    void this.packages;
    return [...this.broken.keys()].map((f) => posix.dirname(f)).filter((d) => d !== '.');
  }

  /**
   * A TOML or YAML or JSON file parsed once; a parse failure is recorded as a degradation and returns null.
   * `quiet` skips the degradation, for files read only to look something up (templated YAML is common).
   */
  structured(rel: string, opts: { quiet?: boolean } = {}): unknown {
    if (this.parsed.has(rel)) return this.parsed.get(rel);
    const text = this.read(rel);
    let value: unknown = null;
    if (text !== null) {
      try {
        if (/\.toml$/.test(rel) || /(^|\/)(Cargo\.lock)$/.test(rel)) value = parseToml(text);
        else if (/\.ya?ml$/.test(rel)) value = parseYaml(text, { uniqueKeys: false });
        else if (/\.json$/.test(rel)) value = JSON.parse(text);
      } catch (err) {
        if (!opts.quiet) this.degrade(rel, `does not parse (${err instanceof Error ? (err.message.split('\n')[0] ?? 'parse error') : String(err)}); claims it would prove are not checked`);
        value = null;
      }
    }
    this.parsed.set(rel, value);
    return value;
  }

  /**
   * Pathspecs that keep generated and vendored files out of evidence: `.gitattributes` entries marked
   * `linguist-generated` or `linguist-vendored` (the convention GitHub reads), minified bundles and vendor folders.
   */
  get generatedExcludes(): string[] {
    if (!this.generated) {
      const patterns = ['**/*.min.js', '**/*.min.css', '**/*.map', 'vendor/**', '**/vendor/**', 'third_party/**'];
      for (const file of this.files.filter((f) => /(^|\/)\.gitattributes$/.test(f))) {
        const base = posix.dirname(file) === '.' ? '' : `${posix.dirname(file)}/`;
        for (const line of (this.read(file) ?? '').split('\n')) {
          const [pattern, ...attrs] = line.trim().split(/\s+/);
          if (!pattern || pattern.startsWith('#') || !attrs.some((a) => /^linguist-(generated|vendored)(=true)?$/.test(a))) continue;
          const rooted = pattern.startsWith('/') ? pattern.slice(1) : pattern.includes('/') ? pattern : `**/${pattern}`;
          patterns.push(`${base}${rooted}`);
        }
      }
      this.generated = patterns.map((p) => `:(exclude,glob)${p}`);
    }
    return this.generated;
  }

  /** Files matching a regular expression over the repository-relative path. */
  find(re: RegExp): string[] {
    return this.files.filter((f) => re.test(f) && !SKIP_DIRS.test(f));
  }

  /** Path of `rel` as seen from the folder of `fromFile`. */
  static near(fromFile: string, rel: string): string {
    return posix.normalize(posix.join(posix.dirname(fromFile), rel));
  }
}

function walk(root: string, base = ''): string[] {
  const out: string[] = [];
  let entries: Dirent[] = [];
  try {
    entries = readdirSync(join(root, base), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (SKIP_DIRS.test(rel)) continue;
    if (e.isDirectory()) out.push(...walk(root, rel));
    else out.push(rel);
  }
  return out;
}

