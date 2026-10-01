import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type Discovered, discover } from './discover.ts';
import { EXIT_CODE } from './model.ts';
import { DEFAULT_VERIFY, type VerifyOptions } from './agent/verify.ts';
import { type FileReport, Run } from './pipeline.ts';
import { toMarkdown } from './report.ts';
import { VERSION } from './version.ts';

export const HELP = `proof ${VERSION}: is your CLAUDE.md still true?

Usage:
  proof check [file...] [--user] [--json] [--out <dir>] [--verbose]
  proof run   [file...] [--user] [--model <id>] [--effort <lvl>] [--budget-usd <n>] [--jobs <n>] [--no-cache] [--json] [--out <dir>]

check   Checks every statement in CLAUDE.md, AGENTS.md and the other instruction files an agent loads
        against the repository with deterministic parsers, follows their @imports, and prints a report.
        With no files, checks every instruction file it discovers.
run     Does the same, then hands every statement the checks left open to a verifier agent (the
        claude CLI, read-only tools), keeps only verdicts whose citations check out, and reports coverage.
        A run can take many minutes; it is working, not stalled.

  --user          Also check ~/.claude/CLAUDE.md, ~/.claude/rules/ and this machine's managed policy file,
                  and follow imports outside the repository (reported, never edited)
  --model <id>    Verifier model (default ${DEFAULT_VERIFY.model})
  --effort <lvl>  Verifier thinking effort: low, medium, high, xhigh, max (default ${DEFAULT_VERIFY.effort})
  --budget-usd    Total spend for the verifier across the run (default ${DEFAULT_VERIFY.budgetUsd})
  --jobs <n>      Verifier calls in parallel (default ${DEFAULT_VERIFY.jobs})
  --no-cache      Ask again even when the code and the statement are unchanged since the last run
  --json          Print JSON (an array, one object per file) instead of markdown
  --out <dir>     Also write <name>.md and <name>.json reports into <dir>
  --verbose       List verified, decided and not-checked statements too

Exit codes: 0 PROVEN, PROVEN WITH OVERRIDES, FIXED or PARTLY PROVEN; 1 NOT PROVEN; 2 UNTESTED or a usage error.`;

const NUMBER = (name: string, v: string | undefined, fallback: number): number => {
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new UsageError(`--${name} needs a positive number, got "${v}"`);
  return n;
};

class UsageError extends Error {}

/** `check` runs the mechanical stage; `run` adds the verifier agent. Same targets, same report. */
async function pipeline(mode: 'check' | 'run', argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: 'boolean' },
      out: { type: 'string' },
      verbose: { type: 'boolean' },
      user: { type: 'boolean' },
      model: { type: 'string' },
      effort: { type: 'string' },
      'budget-usd': { type: 'string' },
      jobs: { type: 'string' },
      'batch-size': { type: 'string' },
      'no-cache': { type: 'boolean' },
      'no-fix': { type: 'boolean' },
    },
  });
  const run = new Run(process.cwd());
  const found = discover(run.repo, { user: Boolean(values.user) });
  // A file named on the command line keeps the reason an agent loads it, when discovery knows one.
  const targets: Discovered[] = positionals.length
    ? positionals.map((p) => found.files.find((d) => resolve(run.repo.root, d.file) === resolve(p)) ?? { file: resolve(p), why: 'named on the command line', scope: 'project' })
    : found.files;
  if (!targets.length) {
    console.error(`No instruction file found. Pass one: proof ${mode} path/to/CLAUDE.md`);
    return 2;
  }
  let reports: FileReport[] = await run.checkTargets(targets, { user: Boolean(values.user) });
  if (!positionals.length && found.skipped.length && !values.json) {
    console.error(found.skipped.map((s) => `skipped ${s.file}: ${s.reason}`).join('\n'));
  }
  if (mode === 'run') {
    const opts: VerifyOptions = {
      ...DEFAULT_VERIFY,
      model: values.model ?? DEFAULT_VERIFY.model,
      effort: values.effort ?? DEFAULT_VERIFY.effort,
      budgetUsd: NUMBER('budget-usd', values['budget-usd'], DEFAULT_VERIFY.budgetUsd),
      jobs: NUMBER('jobs', values.jobs, DEFAULT_VERIFY.jobs),
      batchSize: NUMBER('batch-size', values['batch-size'], DEFAULT_VERIFY.batchSize),
      cache: !values['no-cache'],
    };
    if (!values.json) console.error(`verifying open statements with ${opts.model} (budget $${opts.budgetUsd.toFixed(2)}); this can take minutes`);
    reports = await run.verify(reports, opts);
  }
  if (values.out) {
    mkdirSync(values.out, { recursive: true });
    for (const r of reports) {
      const name = r.file.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
      writeFileSync(join(values.out, `${name}.md`), toMarkdown(r, { verbose: true, mode }));
      writeFileSync(join(values.out, `${name}.json`), `${JSON.stringify(r, null, 2)}\n`);
    }
  }
  if (values.json) console.log(JSON.stringify(reports, null, 2));
  else console.log(reports.map((r) => toMarkdown(r, { verbose: Boolean(values.verbose), mode })).join('\n---\n\n'));
  return Math.max(...reports.map((r) => EXIT_CODE[r.verdict]));
}

export async function main(argv: string[]): Promise<number> {
  const [first, ...rest] = argv;
  if (first === '--help' || first === '-h' || first === 'help') {
    console.log(HELP);
    return 0;
  }
  if (first === '--version' || first === '-v' || first === 'version') {
    console.log(VERSION);
    return 0;
  }
  try {
    if (first === 'check' || first === 'run') return await pipeline(first, rest);
    // `proof CLAUDE.md` and `proof --json` mean `proof check …`.
    if (!first || first.startsWith('-') || /\.(md|mdc)$|rules$/i.test(first)) return await pipeline('check', argv);
  } catch (err) {
    if (err instanceof UsageError || (err instanceof TypeError && 'code' in err && String(err.code).startsWith('ERR_PARSE_ARGS'))) {
      console.error(`${err.message}. Run: proof help`);
      return 2;
    }
    throw err;
  }
  console.error(`Unknown command "${first}". Run: proof help`);
  return 2;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exitCode = 2;
  },
);
