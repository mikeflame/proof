/** Shared vocabulary of the pipeline. Spec sections 4.1 to 4.6. */

export type SpanKind =
  | 'path' // a file or folder in the repository
  | 'link' // a markdown link target
  | 'import' // an @path import
  | 'glob' // a `paths:` frontmatter glob of a rule file
  | 'command' // one simple shell command
  | 'symbol' // an identifier, dotted name or qualified name
  | 'env' // KEY=value
  | 'version' // "Node 24+", "PostgreSQL 18"
  | 'dependency' // a product named in prose ("Stripe")
  | 'unknown' // code the classifier could not type; still reported
  | 'prose'; // a statement with nothing typed in it: the verifier's job

/** How strong the evidence behind a span result is. Spec 4.2. */
export type EvidenceLevel = 'definition' | 'declaration' | 'reference' | 'comment' | 'substring' | 'none';

/** Only these levels may produce VERIFIED. */
export const VERIFYING_LEVELS: ReadonlySet<EvidenceLevel> = new Set(['definition', 'declaration', 'reference']);

export interface Evidence {
  /** `path:line`, a command, or a description of where the evidence is. */
  ref: string;
  excerpt?: string | undefined;
  level: EvidenceLevel;
}

export interface Span {
  kind: SpanKind;
  text: string;
  /** Present for most claims; absent when the statement says the thing was removed or renamed away. */
  expect: 'present' | 'absent';
  /** Folder a preceding `cd` selected, relative to the repository root. */
  cwd?: string;
  /** Folders the surrounding text points at ("run inside `api/`"), tried as working folders. */
  hintDirs?: string[];
}

export type SpanStatus = 'VERIFIED' | 'STALE' | 'UNCONFIRMED' | 'NOT_CHECKED';

export interface SpanResult extends Span {
  status: SpanStatus;
  level: EvidenceLevel;
  evidence: Evidence[];
  /** Why the result is what it is, in one line. */
  reason: string;
  /** NOT_CHECKED because the check could not run (a manifest that does not parse, a failed lookup), not because the thing is external. */
  blocked?: boolean;
}

/** Spec 4.1. */
export type StatementStatus =
  | 'VERIFIED'
  | 'STALE'
  | 'UNCONFIRMED'
  | 'UNVERIFIED_WITH_REASON'
  | 'DECIDED'
  | 'OVERRIDDEN'
  | 'NOT_CHECKED'
  | 'FIXED'
  | 'FIX_REJECTED';

export type StatementKind = 'item' | 'row' | 'sentence' | 'command' | 'import' | 'code-path' | 'frontmatter' | 'marker';

export interface Override {
  reason: string | null;
  line: number;
}

export interface Statement {
  /** sha1 of the normalized text: stable across line moves, changes when the words change. */
  id: string;
  file: string;
  line: number;
  endLine: number;
  section: string;
  kind: StatementKind;
  /** The statement as written, with inline code in backticks. */
  text: string;
  spans: Span[];
  /** Parts no mechanical check covers: counts, status words, quantifiers. They need the verifier. */
  residual: string[];
  /** The statement says something was removed, deleted, retired or renamed. */
  negated: boolean;
  /** Set when an ignore marker covers the statement. */
  override?: Override;
}

export interface CheckedStatement extends Statement {
  status: StatementStatus;
  results: SpanResult[];
  reason: string;
  /** Settled by mechanical checks alone: every typed span verified at definition or declaration level and nothing residual. */
  settled: boolean;
}

/** Spec 4.6. */
export type Verdict = 'PROVEN' | 'PROVEN WITH OVERRIDES' | 'FIXED' | 'PARTLY PROVEN' | 'NOT PROVEN' | 'UNTESTED';

export const EXIT_CODE: Record<Verdict, number> = {
  PROVEN: 0,
  'PROVEN WITH OVERRIDES': 0,
  FIXED: 0,
  'PARTLY PROVEN': 0,
  'NOT PROVEN': 1,
  UNTESTED: 2,
};

export const LEVEL_RANK: Record<EvidenceLevel, number> = { definition: 5, declaration: 4, reference: 3, comment: 2, substring: 1, none: 0 };
