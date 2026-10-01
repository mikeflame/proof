import { posix } from 'node:path';
import { type GitState, gitState } from './core/git.ts';
import { type Degradation, RepoContext } from './core/repo.ts';
import { NO_GRAMMAR, Syntax } from './core/syntax.ts';
import { type CheckedStatement, type EvidenceLevel, type StatementStatus, type Verdict } from './model.ts';
import { parseDocument } from './parse/markdown.ts';
import { checkStatement } from './verify/index.ts';
import { VERSION } from './version.ts';

export interface FileReport {
  file: string;
  verdict: Verdict;
  reason?: string;
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
  const has = (s: StatementStatus) => statements.some((x) => x.status === s);
  if (has('STALE') || has('FIX_REJECTED')) return 'NOT PROVEN';
  if (has('UNCONFIRMED') || has('UNVERIFIED_WITH_REASON')) return 'PARTLY PROVEN';
  if (!statements.some((x) => x.status === 'VERIFIED' || x.status === 'DECIDED' || x.status === 'FIXED' || x.status === 'OVERRIDDEN')) return 'PARTLY PROVEN';
  if (has('FIXED')) return 'FIXED';
  const referenceOnly = statements.some((x) => x.status === 'VERIFIED' && x.results.some((r) => r.status === 'VERIFIED' && r.level === 'reference'));
  if (has('OVERRIDDEN') || referenceOnly) return 'PROVEN WITH OVERRIDES';
  return 'PROVEN';
}

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

  /** Check one instruction file, given relative to the repository root or as an absolute path. */
  async checkFile(file: string): Promise<FileReport> {
    const started = new Date().toISOString();
    this.noteGrammars();
    const rel = this.repo.rel(file) ?? file;
    const counts = emptyCounts();
    const evidenceLevels = emptyLevels();
    const base = { file: rel, counts, evidenceLevels, git: this.git, run: { started, finished: started, version: VERSION } };
    const text = this.repo.read(rel);
    if (text === null) return { ...base, verdict: 'UNTESTED', reason: `${rel} cannot be read`, coverage: { statements: 0, withResult: 0 }, degraded: [...this.repo.degraded], statements: [] };

    const doc = parseDocument(text, rel);
    if (doc.frontmatterError) this.repo.degrade(rel, `frontmatter does not parse (${doc.frontmatterError}); Claude Code loads this rule as if it had no paths`);
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir: posix.dirname(rel) === '.' ? '' : posix.dirname(rel) };
    this.repo.primeIgnored(doc.statements.flatMap((s) => s.spans.filter((sp) => sp.kind === 'path' || sp.kind === 'link').map((sp) => sp.text.replace(/^\.\//, ''))));
    const statements: CheckedStatement[] = [];
    for (const st of doc.statements) statements.push(await checkStatement(ctx, st));
    for (const s of statements) {
      counts[s.status] += 1;
      for (const r of s.results) if (r.status === 'VERIFIED' || r.status === 'UNCONFIRMED') evidenceLevels[r.level] += 1;
    }
    return {
      ...base,
      verdict: verdictOf(statements),
      coverage: { statements: statements.length, withResult: statements.filter((s) => s.results.length > 0).length },
      degraded: [...this.repo.degraded],
      run: { ...base.run, finished: new Date().toISOString() },
      statements: statements.sort((a, b) => a.line - b.line),
    };
  }
}
