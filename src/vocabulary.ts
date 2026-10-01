/**
 * The words proof speaks, in one place: statuses, verdicts, commands and options. The report, the CLI
 * help, the skill and the README are rendered from these lists, and a drift test fails when any of them
 * disagrees (spec 8, 9.2).
 */
import { DEFAULT_VERIFY } from './agent/verify.ts';
import type { StatementStatus, Verdict } from './model.ts';

export interface StatusWord {
  status: StatementStatus;
  /** Section title in the report and the skill. */
  title: string;
  /** One line under the section title. */
  meaning: string;
  /** What the agent driving proof does about it. */
  job: string;
  /** Listed in full always, or only with --verbose. */
  expand: 'always' | 'verbose';
}

/** Spec 7.1 order. */
export const STATUSES: readonly StatusWord[] = [
  { status: 'FIXED', title: 'Fixed', meaning: 'Edited, and a fresh verifier confirmed the new text. Review the diff.', job: 'show the user the diff (`git diff -- <file>`)', expand: 'always' },
  { status: 'FIX_REJECTED', title: 'Fix rejected', meaning: 'The re-verifier refused these edits; they were reverted.', job: 'correct the line by hand from the reason, or ask', expand: 'always' },
  { status: 'STALE', title: 'Stale', meaning: 'The repository contradicts these, and no fix was applied.', job: 'correct it from the reason, or ask', expand: 'always' },
  { status: 'UNCONFIRMED', title: 'Unconfirmed', meaning: 'Part of each has no evidence; nothing contradicts it either.', job: 'relay it to the user as a decision', expand: 'always' },
  { status: 'UNVERIFIED_WITH_REASON', title: 'Unverified with reason', meaning: 'The reason says what evidence is still missing.', job: 'relay it to the user as a decision', expand: 'always' },
  { status: 'OVERRIDDEN', title: 'Overrides', meaning: 'Silenced by a proof:ignore marker with a reason.', job: 'leave it unless the reason no longer holds', expand: 'always' },
  { status: 'DECIDED', title: 'Decided', meaning: 'Settled by a recorded decision.', job: 'nothing', expand: 'verbose' },
  { status: 'VERIFIED', title: 'Verified', meaning: 'Proven at the level shown, or by the verifier with citations proof re-checked.', job: 'nothing', expand: 'verbose' },
  { status: 'NOT_CHECKED', title: 'Not checked', meaning: 'Outside the repository: system files and external tools.', job: 'nothing', expand: 'verbose' },
];

export interface VerdictWord {
  verdict: Verdict;
  exit: number;
  meaning: string;
}

/** Spec 4.6. */
export const VERDICTS: readonly VerdictWord[] = [
  { verdict: 'PROVEN', exit: 0, meaning: 'every statement verified at definition or declaration level, or decided' },
  { verdict: 'PROVEN WITH OVERRIDES', exit: 0, meaning: 'as above, with at least one override or reference-level proof' },
  { verdict: 'FIXED', exit: 0, meaning: 'stale lines were found, and all were fixed and re-verified' },
  { verdict: 'PARTLY PROVEN', exit: 0, meaning: 'open items remain for a decision' },
  { verdict: 'NOT PROVEN', exit: 1, meaning: 'stale lines remain, or a fix was rejected' },
  { verdict: 'UNTESTED', exit: 2, meaning: 'unreadable, or the verifier did not answer every open statement' },
];

export interface CommandWord {
  name: string;
  usage: string;
  summary: string;
}

export const COMMANDS: readonly CommandWord[] = [
  { name: 'check', usage: 'proof check [file...] [--user] [--json] [--out <dir>] [--verbose]', summary: 'Checks every statement of every instruction file an agent loads, and the files they `@import`, with deterministic parsers. Writes nothing.' },
  { name: 'run', usage: 'proof run [file...] [--user] [--no-fix] [--dry-run] [--commit] [--fix-rounds <n>] [--gaps] [--model <id>] [--effort <lvl>] [--budget-usd <n>] [--jobs <n>] [--no-cache] [--json] [--out <dir>]', summary: 'Checks, hands what the checks leave open to a verifier agent whose citations proof re-checks, fixes the stale lines, and re-verifies each fix with a fresh agent. Can take many minutes.' },
  { name: 'decide', usage: 'proof decide <file> [L<line>|<id> (--rule | --fact --evidence <path:line>) --reason "…"]', summary: "Lists a file's open statements, or records a person's decision on one in <file>.proof.json." },
  { name: 'revert', usage: 'proof revert <file> --id <statement id>', summary: 'Puts back the text a fix replaced and records the rejection, so it is not proposed again.' },
  { name: 'install', usage: 'proof install [--claude] [--agents]', summary: 'Copies this skill to ~/.claude/skills/claude-md/ and ~/.agents/skills/claude-md/, so every agent finds it.' },
];

export interface OptionWord {
  flag: string;
  help: string;
}

export const OPTIONS: readonly OptionWord[] = [
  { flag: '--user', help: 'Also check ~/.claude/CLAUDE.md, ~/.claude/rules/ and the managed policy file, follow imports outside the repository, and let fixes edit user files (never managed ones)' },
  { flag: '--no-fix', help: 'Verify only; change nothing' },
  { flag: '--dry-run', help: 'Show the diff the fixes would make, without writing it' },
  { flag: '--commit', help: 'Commit the fixed files and their sidecars (nothing is committed without it)' },
  { flag: '--fix-rounds <n>', help: 'Fix rounds, each re-verified (default 1); a later round sees why earlier edits were rejected' },
  { flag: '--gaps', help: 'Also propose up to five missing lines per file, with evidence; never written' },
  { flag: '--model <id>', help: `Verifier and fixer model (default ${DEFAULT_VERIFY.model})` },
  { flag: '--effort <lvl>', help: `Thinking effort: low, medium, high, xhigh, max (default ${DEFAULT_VERIFY.effort})` },
  { flag: '--budget-usd <n>', help: `Total spend of the agent stages across the run (default ${DEFAULT_VERIFY.budgetUsd})` },
  { flag: '--jobs <n>', help: `Verifier calls in parallel (default ${DEFAULT_VERIFY.jobs})` },
  { flag: '--no-cache', help: 'Ask again even when the code and the statement are unchanged since the last run' },
  { flag: '--json', help: 'Print JSON (an array, one object per file) instead of markdown' },
  { flag: '--out <dir>', help: 'Also write <name>.md and <name>.json reports into <dir>' },
  { flag: '--verbose', help: 'List verified, decided and not-checked statements too' },
];

/** `0 PROVEN, …; 1 NOT PROVEN; 2 UNTESTED or a usage error.` */
export function exitCodesLine(): string {
  const by = new Map<number, string[]>();
  for (const v of VERDICTS) by.set(v.exit, [...(by.get(v.exit) ?? []), v.verdict]);
  return [...by.entries()].map(([code, vs]) => `${code} ${vs.join(', ')}${code === 2 ? ' or a usage error' : ''}`).join('; ');
}

export function renderHelp(version: string): string {
  const pad = Math.max(...OPTIONS.map((o) => o.flag.length)) + 2;
  return [
    `proof ${version}: is your CLAUDE.md still true?`,
    '',
    'Usage:',
    ...COMMANDS.map((c) => `  ${c.usage}`),
    '',
    ...COMMANDS.map((c) => `${c.name.padEnd(8)}${c.summary}`),
    '',
    ...OPTIONS.map((o) => `  ${o.flag.padEnd(pad)}${o.help}`),
    '',
    `Exit codes: ${exitCodesLine()}.`,
  ].join('\n');
}

/** The status table of the skill and the README. */
export function statusTable(): string {
  return ['| Section | Meaning | Your job |', '| --- | --- | --- |', ...STATUSES.map((s) => `| ${s.title} | ${s.meaning} | ${s.job} |`)].join('\n');
}

export function verdictTable(): string {
  return ['| Verdict | Meaning | Exit |', '| --- | --- | --- |', ...VERDICTS.map((v) => `| \`${v.verdict}\` | ${v.meaning} | ${v.exit} |`)].join('\n');
}

export function commandTable(): string {
  return ['| Command | What it does |', '| --- | --- |', ...COMMANDS.map((c) => `| \`proof ${c.name}\` | ${c.summary} |`)].join('\n');
}

export interface MatrixCell {
  ecosystem: string;
  scripts: string;
  versions: string;
  definitions: string;
}

/**
 * Spec 6: what the mechanical stage reads per ecosystem, proven by test/matrix.test.ts. Anything marked
 * "agent only" is left to the verifier agent, which the report shows as unverified until it answers.
 */
export const MATRIX: readonly MatrixCell[] = [
  { ecosystem: 'Node', scripts: 'package.json scripts, workspaces, `npx`/`bunx` binaries', versions: '`engines`, `.nvmrc`, `.node-version`, `.tool-versions`, Dockerfile, CI', definitions: 'tree-sitter TypeScript, TSX, JavaScript' },
  { ecosystem: 'Python', scripts: 'pyproject scripts (`uv`/`poetry`/`pdm`/`hatch run`), tox, nox, `python -m`, `manage.py`', versions: '`requires-python`, `.python-version`, Dockerfile, CI', definitions: 'tree-sitter Python' },
  { ecosystem: 'Go', scripts: '`go run`/`go test` on package paths', versions: 'go.mod `go` and `toolchain`', definitions: 'tree-sitter Go, `pkg.Symbol`, receivers, struct tags' },
  { ecosystem: 'Rust', scripts: 'cargo commands, aliases, `-p` crates', versions: '`rust-toolchain`, `rust-version`', definitions: 'tree-sitter Rust' },
  { ecosystem: 'JVM', scripts: 'Gradle tasks (registered or standard), Maven phases', versions: 'agent only', definitions: 'tree-sitter Java; Kotlin by line patterns' },
  { ecosystem: 'Ruby, PHP, .NET', scripts: 'rake tasks from the syntax tree, composer scripts, `dotnet` projects', versions: 'Gemfile `ruby`; PHP and .NET agent only', definitions: 'tree-sitter Ruby, PHP, C#' },
  { ecosystem: 'Shell', scripts: 'functions and `case` labels in any script, justfile recipes, Taskfile tasks', versions: '', definitions: 'tree-sitter Bash' },
  { ecosystem: 'Containers and CI', scripts: 'compose services, workflow job names', versions: 'compose and Dockerfile image tags', definitions: 'YAML parse; Dockerfile stages agent only' },
];

export function matrixTable(corpus: { ecosystem: string }[] = []): string {
  const count = (e: string) => corpus.filter((c) => e.split(/,\s*/).some((x) => c.ecosystem === x || (x === 'Ruby' && c.ecosystem === 'Ruby'))).length;
  return ['| Ecosystem | Scripts and tasks | Versions | Definitions | Corpus repos |', '| --- | --- | --- | --- | --- |', ...MATRIX.map((m) => `| ${m.ecosystem} | ${m.scripts} | ${m.versions || '—'} | ${m.definitions} | ${count(m.ecosystem) || '—'} |`)].join('\n');
}
