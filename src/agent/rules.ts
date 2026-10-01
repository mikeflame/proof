/**
 * The verifier's rules. One source: the agent prompt renders them, and the skill and README are
 * generated from the same list (spec 3.4, 8).
 */
export const VERIFIER_RULES: readonly string[] = [
  'Judge each statement against this repository as it is on disk now, never against your memory of how projects usually look.',
  'A verdict of true or stale must cite evidence[]. Without evidence the verdict is rejected and the statement stays unverified.',
  'Evidence is inspectable: a file_line ref is `path:line` (or `path:start-end`) with an excerpt copied from that line; a command, count, git_log or absence ref is a read-only command proof re-runs, and its excerpt must appear in the output (absence: the command prints nothing).',
  'Do the work before you answer: open the files a statement names, search for what it claims, count what it counts, read the config it relies on. Every number is recounted and the command you used is the evidence. You have time and budget for this.',
  'An unverified_with_reason answer names the evidence you looked for and did not find, and where you looked. "I did not check" is never a reason.',
  'Stale means something the statement asserts is false in this repository. A statement that leaves out an exception or a detail, or is less precise than the code, is not stale: answer true if what it does state holds, and name the omission in the reason.',
  'Rules ("never", "always", "prefer", "must") are checked against the repository tooling (lint, formatter, type-checker, CI, pre-commit), never against taste. A rule is stale only when the repository makes it wrong to follow: tooling enforces the opposite, or the thing it refers to is gone; cite the config file. Code that does not always follow a rule does not make the rule stale: answer unverified_with_reason and cite the exceptions. A rule is true only with evidence that tooling enforces it or the code follows it.',
  'A convention written as a description of how the code is meant to be ("the endpoint stays thin", "X is the only place that serializes errors", "every endpoint declares its types in …") is a rule too: where most of the code follows it and some does not, answer unverified_with_reason and cite the exceptions. It is stale only where the repository contradicts it outright: most of the code does otherwise, or the thing it names is gone.',
  'Status words (active, legacy, deprecated, canonical, preferred) are checked against `git log` recency and against where new code lands.',
  'A statement that something was removed or renamed is checked for absence: cite the search that finds nothing, as kind absence with the command as ref (for example `git grep -n old_name`). The same goes for a stale path or name: an absence citation proves it is gone.',
  'Command refs run from the repository root; write paths relative to it.',
  'When the mechanical check already proved a name, do not repeat it; verify what the reason says is still open.',
  'If the mechanical check marked a statement stale, confirm it and propose the corrected text, or dispute it with evidence.',
  'For a stale statement, proposed_text is the corrected statement in the author\'s words and format, changed only where the evidence requires.',
  'When in doubt the verdict is unverified_with_reason, never true. Your confidence is not evidence.',
  'Never edit, create or delete files. Never run a command that writes.',
];

export const EVIDENCE_KINDS = ['file_line', 'command_output', 'count', 'git_log', 'absence'] as const;
export const VERIFIER_VERDICTS = ['true', 'stale', 'unverified_with_reason'] as const;
export const ACTIONS = ['auto-fix', 'fix-with-evidence', 'pointer', 'needs-decision', 'no-op'] as const;

/** Structured output schema for one verifier call: spec 4.4, one entry per statement. */
export const VERIFIER_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement_id: { type: 'string' },
          verdict: { type: 'string', enum: [...VERIFIER_VERDICTS] },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: [...EVIDENCE_KINDS] },
                ref: { type: 'string' },
                excerpt: { type: 'string', maxLength: 200 },
              },
              required: ['kind', 'ref'],
            },
          },
          reason: { type: 'string' },
          proposed_text: { type: 'string' },
          action: { type: 'string', enum: [...ACTIONS] },
        },
        required: ['statement_id', 'verdict', 'evidence', 'reason', 'action'],
      },
    },
  },
  required: ['results'],
} as const;

/** The fixer's policy: spec 5. Rendered into the fixer prompt and the skill from this one list. */
export const FIXER_RULES: readonly string[] = [
  'Correct only what the evidence shows is wrong. Never add a statement, a line or a section, and never add content to close a gap.',
  'Tier A (mechanical): a stale path, link, import, script name, subcommand or version where the repository offers exactly one candidate. Use the candidate.',
  'Tier B (rewrite with evidence): rewrite the statement to what the evidence shows, keeping the author\'s phrasing and format wherever it still holds.',
  'Tier C (pointer): when the statement copies something the repository owns (a command list from package.json or a Makefile), replace the copy with a pointer to the owner named in the ownership map, or to the file the evidence came from.',
  'Never delete a rule; rewrite it to match the tooling, citing the config file.',
  'Never rewrite a rule or a convention into a description of the code that breaks it ("some endpoints also …", "the main place" for "the only place"): whether the exceptions or the convention should change is a person\'s decision, so return action none for that part.',
  'Delete a fact only with evidence that the thing is absent (an absence citation). A fact that is merely unverified stays.',
  '`old` is an exact substring of the statement\'s source lines, as written in the file, and `new` replaces it. Keep list markers, backticks, links and line breaks; `new` has no more lines than `old`.',
  'Every edit cites the evidence it relies on, in the same kinds the verifier uses. An edit without a citation that checks out is not applied.',
  'Never propose again a fix a person or the re-verifier rejected; the rejected fixes are listed.',
  'If no edit is justified, return action none with the reason.',
  'Never edit, create or delete files yourself; proof applies the edits you return.',
];

export const FIXER_SCHEMA = {
  type: 'object',
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement_id: { type: 'string' },
          tier: { type: 'string', enum: ['A', 'B', 'C'] },
          action: { type: 'string', enum: ['replace', 'delete', 'none'] },
          old: { type: 'string' },
          new: { type: 'string' },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: { kind: { type: 'string', enum: [...EVIDENCE_KINDS] }, ref: { type: 'string' }, excerpt: { type: 'string', maxLength: 200 } },
              required: ['kind', 'ref'],
            },
          },
          reason: { type: 'string' },
        },
        required: ['statement_id', 'action', 'evidence', 'reason'],
      },
    },
  },
  required: ['edits'],
} as const;
