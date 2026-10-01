import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, posix, resolve } from 'node:path';
import { type GitState, gitState } from './core/git.ts';
import { type Degradation, RepoContext } from './core/repo.ts';
import { NO_GRAMMAR, Syntax } from './core/syntax.ts';
import type { Discovered, Scope } from './discover.ts';
import type { CheckedStatement, EvidenceLevel, StatementStatus, Verdict } from './model.ts';
import { parseDocument } from './parse/markdown.ts';
import { checkStatement } from './verify/index.ts';
import { pathBaseOf } from './verify/util.ts';
import { VERSION } from './version.ts';

/** Claude Code follows `@path` imports this many hops deep, and no further. */
export const MAX_IMPORT_HOPS = 4;

export interface ImportInfo {
  /** As written after the `@`. */
  path: string;
  line: number;
  /** Repository-relative, or absolute outside the repository; null when it does not resolve to a file. */
  resolved: string | null;
  followed: boolean;
  /** Why it was or was not checked as an instruction file of its own. */
  note: string;
}

export interface FileReport {
  file: string;
  /** Worst of this file's own verdict and the verdicts of the files it imports: what an agent loads through it. */
  verdict: Verdict;
  /** The verdict of this file's own statements alone. */
  ownVerdict: Verdict;
  reason?: string;
  scope: Scope;
  why: string;
  imports: ImportInfo[];
  importedBy: string[];
  counts: Record<StatementStatus, number>;
  evidenceLevels: Record<EvidenceLevel, number>;
  coverage: { statements: number; withResult: number };
  degraded: Degradation[];
  git: GitState | null;
  run: { started: string; finished: string; version: string };
  statements: CheckedStatement[];
}

const emptyCounts = (): Record<StatementStatus, number> => ({ VERIFIED: 0, STALE: 0, UNCONFIRMED: 0, UNVERIFIED_WITH_REASON: 0, DECIDED: 0, OVERRIDDEN: 0, NOT_CHECKED: 0, FIXED: 0, FIX_REJECTED: 0 });
const emptyLevels = (): Record<EvidenceLevel, number> => ({ definition: 0, declaration: 0, reference: 0, comment: 0, substring: 0, none: 0 });

/** File verdict from statement statuses. Spec 4.6. */
export function verdictOf(statements: CheckedStatement[]): Verdict {
  // A file that states nothing cannot be wrong.
  if (!statements.length) return 'PROVEN';
  const has = (s: StatementStatus) => statements.some((x) => x.status === s);
  if (has('STALE') || has('FIX_REJECTED')) return 'NOT PROVEN';
  if (has('UNCONFIRMED') || has('UNVERIFIED_WITH_REASON')) return 'PARTLY PROVEN';
  if (!statements.some((x) => x.status === 'VERIFIED' || x.status === 'DECIDED' || x.status === 'FIXED' || x.status === 'OVERRIDDEN')) return 'PARTLY PROVEN';
  if (has('FIXED')) return 'FIXED';
  const referenceOnly = statements.some((x) => x.status === 'VERIFIED' && x.results.some((r) => r.status === 'VERIFIED' && r.level === 'reference'));
  if (has('OVERRIDDEN') || referenceOnly) return 'PROVEN WITH OVERRIDES';
  return 'PROVEN';
}

const SEVERITY: Record<Verdict, number> = { PROVEN: 0, FIXED: 1, 'PROVEN WITH OVERRIDES': 2, 'PARTLY PROVEN': 3, 'NOT PROVEN': 4, UNTESTED: 5 };

/** The worse of two verdicts. */
export const worst = (a: Verdict, b: Verdict): Verdict => (SEVERITY[b] > SEVERITY[a] ? b : a);

const INSTRUCTION_EXT = /\.(md|mdc|markdown|txt)$/i;

/** One run over a repository: shared caches for every file it checks. */
export class Run {
  readonly repo: RepoContext;
  readonly syntax: Syntax;
  readonly git: GitState | null;
  private noted = false;

  constructor(cwd: string) {
    this.repo = new RepoContext(cwd);
    this.syntax = new Syntax(this.repo);
    this.git = this.repo.isGit ? gitState(this.repo.root) : null;
  }

  /** Languages present without a grammar are named once in the header. */
  private noteGrammars(): void {
    if (this.noted) return;
    this.noted = true;
    for (const [re, lang] of NO_GRAMMAR) {
      const n = this.repo.files.filter((f) => re.test(f)).length;
      if (n) this.repo.degrade(`grammar ${lang}`, `no tree-sitter grammar for ${lang} (${n} file${n === 1 ? '' : 's'}): definitions there are matched by line patterns`);
    }
  }

  /** A path as the report names it: repository-relative inside the repository, absolute outside. */
  private key(file: string, base = ''): string {
    const abs = file.startsWith('~/') ? join(homedir(), file.slice(2)) : isAbsolute(file) ? file : resolve(this.repo.root, base, file);
    return this.repo.rel(abs) ?? abs;
  }

  private real(key: string): string {
    try {
      return realpathSync(isAbsolute(key) ? key : join(this.repo.root, key));
    } catch {
      return key;
    }
  }

  /**
   * Check the targets and every instruction file they import, depth first, so each importer's verdict
   * includes what it pulls in. Each real file is checked once. Spec 3.1.
   */
  async checkTargets(targets: Discovered[], opts: { user?: boolean } = {}): Promise<FileReport[]> {
    const reports = new Map<string, FileReport>();
    const order: string[] = [];
    const visit = async (target: Discovered, hops: number, importer: string | null): Promise<FileReport> => {
      const key = this.key(target.file);
      const real = this.real(key);
      const existing = reports.get(real);
      if (existing) {
        if (importer && !existing.importedBy.includes(importer)) existing.importedBy.push(importer);
        return existing;
      }
      const report = await this.checkFile(key, target);
      reports.set(real, report);
      order.push(real);
      if (importer) report.importedBy.push(importer);
      for (const imp of report.imports) {
        if (!imp.resolved) continue;
        const outside = isAbsolute(imp.resolved);
        if (!INSTRUCTION_EXT.test(imp.resolved)) imp.note = 'loaded as is; not an instruction file to check';
        else if (outside && !opts.user) imp.note = 'outside the repository: pass --user to check it';
        else if (hops + 1 > MAX_IMPORT_HOPS) imp.note = `beyond ${MAX_IMPORT_HOPS} hops: Claude Code does not load it from here`;
        else {
          const child = await visit({ file: imp.resolved, why: `imported by ${report.file}`, scope: outside ? 'user' : 'import' }, hops + 1, report.file);
          imp.followed = true;
          imp.note = child === report ? 'imports itself' : `checked: ${child.ownVerdict}`;
          report.verdict = worst(report.verdict, child.verdict);
        }
      }
      return report;
    };
    for (const t of targets) await visit(t, 0, null);
    return order.map((r) => reports.get(r)).filter((r): r is FileReport => Boolean(r));
  }

  /** Check one instruction file, given relative to the repository root or as an absolute path. */
  async checkFile(file: string, target?: Discovered): Promise<FileReport> {
    const started = new Date().toISOString();
    this.noteGrammars();
    const rel = this.key(file);
    const counts = emptyCounts();
    const evidenceLevels = emptyLevels();
    const base = {
      file: rel,
      scope: target?.scope ?? ('project' as Scope),
      why: target?.why ?? 'named on the command line',
      imports: [] as ImportInfo[],
      importedBy: [] as string[],
      counts,
      evidenceLevels,
      git: this.git,
      run: { started, finished: started, version: VERSION },
    };
    const text = this.repo.read(rel);
    if (text === null) return { ...base, verdict: 'UNTESTED', ownVerdict: 'UNTESTED', reason: `${rel} cannot be read`, coverage: { statements: 0, withResult: 0 }, degraded: [...this.repo.degraded], statements: [] };

    const doc = parseDocument(text, rel);
    if (doc.frontmatterError) this.repo.degrade(rel, `frontmatter does not parse (${doc.frontmatterError}); Claude Code loads this rule as if it had no paths`);
    const dir = posix.dirname(rel);
    const docDir = dir === '.' ? '' : dir;
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir, pathBase: isAbsolute(rel) ? '' : pathBaseOf(rel, docDir) };
    this.repo.primeIgnored(doc.statements.flatMap((s) => s.spans.filter((sp) => sp.kind === 'path' || sp.kind === 'link').map((sp) => sp.text.replace(/^\.\//, ''))));
    const statements: CheckedStatement[] = [];
    for (const st of doc.statements) statements.push(await checkStatement(ctx, st));
    for (const s of statements) {
      counts[s.status] += 1;
      for (const r of s.results) if (r.status === 'VERIFIED' || r.status === 'UNCONFIRMED') evidenceLevels[r.level] += 1;
    }
    const imports = doc.imports.map((imp): ImportInfo => {
      const key = this.key(imp.path, isAbsolute(rel) ? dir : ctx.docDir);
      const exists = existsSync(isAbsolute(key) ? key : join(this.repo.root, key));
      return { path: imp.path, line: imp.line, resolved: exists ? key : null, followed: false, note: exists ? '' : 'does not resolve to a file' };
    });
    const ownVerdict = verdictOf(statements);
    return {
      ...base,
      imports,
      verdict: ownVerdict,
      ownVerdict,
      coverage: { statements: statements.length, withResult: statements.filter((s) => s.results.length > 0).length },
      degraded: [...this.repo.degraded],
      run: { ...base.run, finished: new Date().toISOString() },
      statements: statements.sort((a, b) => a.line - b.line),
    };
  }
}
