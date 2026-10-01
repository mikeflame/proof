import { existsSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, posix, resolve } from 'node:path';
import { type GitState, gitState } from './core/git.ts';
import { type Degradation, RepoContext } from './core/repo.ts';
import { NO_GRAMMAR, Syntax } from './core/syntax.ts';
import type { Discovered, Scope } from './discover.ts';
import type { CheckedStatement, EvidenceLevel, FixOutcome, StatementStatus, Verdict } from './model.ts';
import { appendDecisions, type DecisionRecord, loadDecisions, replayDecisions, sidecarPath } from './decisions.ts';
import { parseDocument } from './parse/markdown.ts';
import { applyEdits, type FixOptions, type ProposedEdit, proposeFixes, unifiedDiff } from './agent/fix.ts';
import type { GapProposal } from './agent/gaps.ts';
import { type AgentCoverage, type VerifyOptions, verifyFiles } from './agent/verify.ts';
import { checkStatement } from './verify/index.ts';
import { pathBaseOf } from './verify/util.ts';
import { VERSION } from './version.ts';

/** Claude Code follows `@path` imports this many hops deep, and no further. */
export const MAX_IMPORT_HOPS = 4;

export interface FileFix {
  proposed: ProposedEdit[];
  accepted: ProposedEdit[];
  rejected: ProposedEdit[];
  failure: string | null;
  costUsd: number;
  before: string;
  after: string;
  reverified: Map<ProposedEdit, { verdict: string; statements: CheckedStatement[] }>;
}

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
  /** The agent stage, when it ran. */
  agent?: AgentCoverage;
  git: GitState | null;
  /** budgetUsd: what the agent stages of the whole run spent, the same on every file of the run. */
  run: { started: string; finished: string; version: string; budgetUsedUsd?: number };
  statements: CheckedStatement[];
  /** The decisions sidecar as read at the start of the run. Spec 4.5. */
  decisions: DecisionRecord[];
  /** Decisions whose line was edited since: that line is open again. */
  reopened: DecisionRecord[];
  /** The edit this run made to the file (or would make, with --dry-run), as a unified diff. */
  diff?: string;
  /** With --gaps: lines the file is missing, proposed with evidence and never written. */
  gaps?: GapProposal[];
  /** Every edit the fixer proposed and what became of it. Spec 7.2. */
  fixes?: { statement_id: string; line: number; tier: string; action: string; old: string; new: string; outcome: FixOutcome['outcome']; reverify: string; refused: string | null }[];
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
  // Reference-level proof is weaker; a statement the verifier proved with a citation is not.
  const referenceOnly = statements.some((x) => x.status === 'VERIFIED' && !x.agent && x.results.some((r) => r.status === 'VERIFIED' && r.level === 'reference'));
  if (has('OVERRIDDEN') || referenceOnly) return 'PROVEN WITH OVERRIDES';
  return 'PROVEN';
}

/**
 * An edit that proves what it changed may leave older wording open: every span it introduced is
 * verified, nothing in the edited statement is stale or unconfirmed, and the verifier did not call the
 * new text stale. It is applied, and the statement stays listed as open for its untouched part.
 */
export function improves(edited: CheckedStatement, original: CheckedStatement | undefined): boolean {
  if (edited.status !== 'UNVERIFIED_WITH_REASON' || edited.agent?.verdict === 'stale') return false;
  const typed = edited.results.filter((r) => r.kind !== 'prose');
  if (typed.some((r) => r.status === 'STALE' || r.status === 'UNCONFIRMED' || r.blocked)) return false;
  const before = new Set((original?.results ?? []).map((r) => r.text));
  const introduced = typed.filter((r) => !before.has(r.text));
  return introduced.length > 0 && introduced.every((r) => r.status === 'VERIFIED');
}

/** Recount a report after its statements changed; an incomplete agent stage makes the file UNTESTED. */
export function tally(r: FileReport): void {
  const counts = emptyCounts();
  const levels = emptyLevels();
  for (const s of r.statements) {
    counts[s.status] += 1;
    for (const x of s.results) if (x.status === 'VERIFIED' || x.status === 'UNCONFIRMED') levels[x.level] += 1;
  }
  r.counts = counts;
  r.evidenceLevels = levels;
  r.ownVerdict = verdictOf(r.statements);
  if (r.agent && r.agent.answered < r.agent.sent) {
    r.ownVerdict = 'UNTESTED';
    r.reason = `the verifier answered ${r.agent.answered} of ${r.agent.sent} open statements: ${r.agent.failures.join('; ') || 'no verdict for the rest'}`;
  }
  r.verdict = r.ownVerdict;
}

/**
 * Mark the final reports with what the fix stage did: the new statements of applied fixes are FIXED, a
 * rejected fix leaves its statement FIX_REJECTED, a refused or dry-run fix is shown on the stale line.
 */
export function annotateFixes(reports: FileReport[], fixes: Map<string, FileFix>, dryRun: boolean): void {
  for (const r of reports) {
    const f = fixes.get(r.file);
    if (!f) continue;
    r.diff = unifiedDiff(r.file, f.before, f.after);
    const outcomeOf = (e: ProposedEdit): FixOutcome['outcome'] => (e.refused ? 'refused' : f.rejected.includes(e) ? 'rejected' : dryRun ? 'dry-run' : 'applied');
    r.fixes = f.proposed.map((e) => ({ statement_id: e.statementId, line: e.line, tier: e.tier, action: e.action, old: e.old, new: e.new, outcome: outcomeOf(e), reverify: f.reverified.get(e)?.verdict ?? '', refused: e.refused }));
    for (const e of f.proposed) {
      const outcome = outcomeOf(e);
      const base: FixOutcome = { tier: e.tier, action: e.action, old: e.old, new: e.new, reason: e.reason, evidence: e.evidence, outcome, reverify: e.refused ?? f.reverified.get(e)?.verdict ?? '' };
      if (outcome === 'applied') {
        const ids = new Set((f.reverified.get(e)?.statements ?? []).map((s) => s.id));
        // A statement whose untouched wording is still open keeps its status; the fix shows on it.
        r.statements = r.statements.map((s) => (ids.has(s.id) ? (s.status === 'VERIFIED' || s.status === 'DECIDED' ? { ...s, status: 'FIXED', reason: `fixed (tier ${e.tier}) and re-verified`, fix: { ...base, was: e.was } } : { ...s, fix: { ...base, was: e.was } }) : s));
        continue;
      }
      r.statements = r.statements.map((s) => {
        if (s.id !== e.statementId) return s;
        if (outcome === 'rejected') return { ...s, status: 'FIX_REJECTED', reason: `the fix was reverted: ${base.reverify}`, fix: base };
        return { ...s, fix: base };
      });
    }
    tally(r);
  }
  combineVerdicts(reports);
}

/** Each importer's verdict is the worst of its own and of everything it imports, transitively. */
export function combineVerdicts(reports: FileReport[]): void {
  const byFile = new Map(reports.map((r) => [r.file, r]));
  const memo = new Map<string, Verdict>();
  const of = (r: FileReport, stack: Set<string>): Verdict => {
    const known = memo.get(r.file);
    if (known) return known;
    let v = r.ownVerdict;
    stack.add(r.file);
    for (const imp of r.imports) {
      const child = imp.followed && imp.resolved ? byFile.get(imp.resolved) : undefined;
      if (child && !stack.has(child.file)) v = worst(v, of(child, stack));
    }
    stack.delete(r.file);
    memo.set(r.file, v);
    return v;
  };
  for (const r of reports) r.verdict = of(r, new Set());
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
   * The agent stage over reports from `checkTargets`: open statements go to the verifier, counts and
   * verdicts are recomputed, and a file whose open statements were not all answered is UNTESTED.
   */
  async verify(reports: FileReport[], opts: VerifyOptions): Promise<FileReport[]> {
    const files = reports.filter((r) => r.statements.length).map((r) => ({ file: r.file, why: r.why, statements: r.statements }));
    const coverage = await verifyFiles(this.repo, files, reports.map((r) => r.file), opts);
    for (const r of reports) {
      const cov = coverage.get(r.file);
      if (cov) r.agent = cov;
      tally(r);
    }
    combineVerdicts(reports);
    return reports;
  }

  /** Mechanical results for every statement of `text`, read as the file `rel`. */
  async checkText(rel: string, text: string): Promise<CheckedStatement[]> {
    const doc = parseDocument(text, rel);
    const dir = posix.dirname(rel);
    const docDir = dir === '.' ? '' : dir;
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir, pathBase: isAbsolute(rel) ? '' : pathBaseOf(rel, docDir) };
    const out: CheckedStatement[] = [];
    for (const st of doc.statements) out.push(await checkStatement(ctx, st));
    return out;
  }

  /**
   * The fix stage (spec 3.5 to 3.7): the fixer proposes an edit per stale statement, proof vets it against
   * the autofix policy, a fresh verifier re-checks each edited statement on its own, and only edits it
   * accepts are written. Every applied and rejected fix is recorded in the sidecar with tree and head.
   */
  async fix(reports: FileReport[], opts: FixOptions & { dryRun: boolean; verify: VerifyOptions }): Promise<Map<string, FileFix>> {
    const out = new Map<string, FileFix>();
    for (const r of reports) {
      const stale = r.statements.filter((s) => s.status === 'STALE');
      if (!stale.length) continue;
      const source = this.repo.read(r.file) ?? '';
      const proposed = await proposeFixes(this.repo, r.file, r.scope, stale, r.decisions, opts);
      const outcome: FileFix = { proposed: proposed.edits, accepted: [], rejected: [], failure: proposed.failure, costUsd: proposed.costUsd, before: source, after: source, reverified: new Map() };
      out.set(r.file, outcome);
      const vetted = proposed.edits.filter((e) => !e.refused);
      // Each edit is re-verified alone: the statements it produces, mechanically, then by a fresh verifier.
      const trial = new Map<ProposedEdit, CheckedStatement[]>();
      for (const e of vetted) {
        const candidate = applyEdits(source, [e]);
        const delta = candidate.split('\n').length - source.split('\n').length;
        const oldIds = new Set(r.statements.map((s) => s.id));
        const produced = (await this.checkText(r.file, candidate)).filter((s) => s.line >= e.line && s.line <= Math.max(e.line, e.endLine + delta) && !oldIds.has(s.id));
        trial.set(e, produced);
      }
      const toVerify = [...trial.values()].flat();
      if (toVerify.length) {
        const note = `These statements are proposed corrections that are not written yet: ${r.file} on disk still has the old text. Judge each statement exactly as given here against the repository; do not judge the file on disk.`;
        const cov = await verifyFiles(this.repo, [{ file: r.file, why: r.why, statements: toVerify, note }], reports.map((x) => x.file), { ...opts.verify, budgetUsd: Math.min(opts.verify.budgetUsd, toVerify.length * opts.verify.perStatementUsd + 0.5) });
        outcome.costUsd += cov.get(r.file)?.costUsd ?? 0;
      }
      for (const e of vetted) {
        const produced = (trial.get(e) ?? []).map((s) => toVerify.find((t) => t.id === s.id && t.line === s.line) ?? s);
        const original = r.statements.find((s) => s.id === e.statementId);
        const failed = produced.find((s) => s.status !== 'VERIFIED' && s.status !== 'DECIDED' && s.status !== 'NOT_CHECKED' && !improves(s, original));
        const cited = failed?.agent?.evidence.find((x) => x.valid) ?? failed?.results.find((x) => x.status === 'STALE')?.evidence[0];
        const verdict = failed
          ? `${failed.status.toLowerCase().replace(/_/g, ' ')}: ${failed.agent?.rejected ?? failed.agent?.reason ?? failed.reason}${cited ? ` (${cited.ref}${'excerpt' in cited && cited.excerpt ? ` "${cited.excerpt.slice(0, 80)}"` : ''})` : ''}`
          : produced.length
            ? 'verified'
            : 'removed, with evidence of absence';
        outcome.reverified.set(e, { verdict, statements: produced });
        if (failed || (e.action === 'replace' && !produced.length)) outcome.rejected.push(e);
        else outcome.accepted.push(e);
      }
      outcome.after = applyEdits(source, outcome.accepted);
      if (!opts.dryRun && outcome.after !== source) writeFileSync(isAbsolute(r.file) ? r.file : join(this.repo.root, r.file), outcome.after);
      if (!opts.dryRun) {
        const at = new Date().toISOString();
        const tree = this.git?.tree ?? null;
        const head = this.git?.head ?? null;
        const by = `proof ${VERSION} (${opts.model})`;
        const byId = new Map(r.statements.map((s) => [s.id, s]));
        appendDecisions(this.repo.root, r.file, [
          ...outcome.accepted.flatMap((e) => {
            const produced = outcome.reverified.get(e)?.statements ?? [];
            return (produced.length ? produced : [null]).map((p): DecisionRecord => ({ statement_id: p?.id ?? e.statementId, text: p?.text ?? '', kind: 'fixed', reason: e.reason, evidence: e.evidence.filter((x) => x.valid).map(({ kind, ref, excerpt }) => ({ kind, ref, excerpt })), by, at, tree, head, previous: byId.get(e.statementId)?.text, tier: e.tier, edit: { old: e.old, new: e.new }, line: e.line }));
          }),
          ...outcome.rejected.map((e): DecisionRecord => ({ statement_id: e.statementId, text: byId.get(e.statementId)?.text ?? '', kind: 'fix-rejected', reason: `re-verifier: ${outcome.reverified.get(e)?.verdict ?? 'rejected'}`, evidence: [], by, at, tree, head, previous: byId.get(e.statementId)?.text, tier: e.tier, edit: { old: e.old, new: e.new } })),
        ]);
      }
    }
    return out;
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
    if (text === null) return { ...base, verdict: 'UNTESTED', ownVerdict: 'UNTESTED', reason: `${rel} cannot be read`, coverage: { statements: 0, withResult: 0 }, degraded: [...this.repo.degraded], statements: [], decisions: [], reopened: [] };

    const doc = parseDocument(text, rel);
    if (doc.frontmatterError) this.repo.degrade(rel, `frontmatter does not parse (${doc.frontmatterError}); Claude Code loads this rule as if it had no paths`);
    const dir = posix.dirname(rel);
    const docDir = dir === '.' ? '' : dir;
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir, pathBase: isAbsolute(rel) ? '' : pathBaseOf(rel, docDir) };
    this.repo.primeIgnored(doc.statements.flatMap((s) => s.spans.filter((sp) => sp.kind === 'path' || sp.kind === 'link').map((sp) => sp.text.replace(/^\.\//, ''))));
    const checked: CheckedStatement[] = [];
    for (const st of doc.statements) checked.push(await checkStatement(ctx, st));
    const sidecar = loadDecisions(this.repo.root, rel);
    if (sidecar.error) this.repo.degrade(sidecarPath(rel), `${sidecar.error}; recorded decisions are not replayed`);
    const { statements, reopened } = replayDecisions(this.repo.root, checked, sidecar.records);
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
      decisions: sidecar.records,
      reopened,
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
