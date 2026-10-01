import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type Discovered, discover } from './discover.ts';
import { EXIT_CODE } from './model.ts';
import { type FileReport, Run } from './pipeline.ts';
import { toMarkdown } from './report.ts';
import { VERSION } from './version.ts';

export const HELP = `proof ${VERSION}: is your CLAUDE.md still true?

Usage:
  proof check [file...] [--user] [--json] [--out <dir>] [--verbose]

Checks every statement in CLAUDE.md, AGENTS.md and the other instruction files an agent loads
against the repository, follows their @imports, and prints a markdown report. With no files,
checks every instruction file it discovers.

  --user        Also check ~/.claude/CLAUDE.md, ~/.claude/rules/ and this machine's managed policy
                file, and follow imports outside the repository (reported, never edited)
  --json        Print JSON (an array, one object per file) instead of markdown
  --out <dir>   Also write <name>.md and <name>.json reports into <dir>
  --verbose     List verified, decided and not-checked statements too

Exit codes: 0 PROVEN, PROVEN WITH OVERRIDES, FIXED or PARTLY PROVEN; 1 NOT PROVEN; 2 UNTESTED or a usage error.`;

async function check(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: 'boolean' }, out: { type: 'string' }, verbose: { type: 'boolean' }, user: { type: 'boolean' } },
  });
  const run = new Run(process.cwd());
  const found = discover(run.repo, { user: Boolean(values.user) });
  // A file named on the command line keeps the reason an agent loads it, when discovery knows one.
  const targets: Discovered[] = positionals.length
    ? positionals.map((p) => found.files.find((d) => resolve(run.repo.root, d.file) === resolve(p)) ?? { file: resolve(p), why: 'named on the command line', scope: 'project' })
    : found.files;
  if (!targets.length) {
    console.error('No instruction file found. Pass one: proof check path/to/CLAUDE.md');
    return 2;
  }
  const reports: FileReport[] = await run.checkTargets(targets, { user: Boolean(values.user) });
  if (!positionals.length && found.skipped.length && !values.json) {
    console.error(found.skipped.map((s) => `skipped ${s.file}: ${s.reason}`).join('\n'));
  }
  if (values.out) {
    mkdirSync(values.out, { recursive: true });
    for (const r of reports) {
      const name = r.file.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
      writeFileSync(join(values.out, `${name}.md`), toMarkdown(r, { verbose: true }));
      writeFileSync(join(values.out, `${name}.json`), `${JSON.stringify(r, null, 2)}\n`);
    }
  }
  if (values.json) console.log(JSON.stringify(reports, null, 2));
  else console.log(reports.map((r) => toMarkdown(r, { verbose: Boolean(values.verbose) })).join('\n---\n\n'));
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
  if (first === 'check') return check(rest);
  // `proof CLAUDE.md` and `proof --json` mean `proof check …`.
  if (!first || first.startsWith('-') || /\.(md|mdc)$|rules$/i.test(first)) return check(argv);
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
