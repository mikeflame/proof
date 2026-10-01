import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { discover, proveFile, toMarkdown, type Verdict } from './report.ts';
import { VERSION } from './version.ts';

const HELP = `proof ${VERSION}: is your CLAUDE.md still true?

Usage: node claims.mjs [file...] [--json] [--out <dir>]

Checks every statement in CLAUDE.md / AGENTS.md against the repository and prints a
markdown report. With no files, checks every CLAUDE.md and AGENTS.md git knows about.

  --json        Print JSON instead of markdown
  --out <dir>   Also write <name>.md and <name>.json reports into <dir>

Exit codes: 0 PROVEN or PARTLY PROVEN, 1 NOT PROVEN (something is stale), 2 a file is missing or usage error.`;

const EXIT: Record<Verdict, number> = { PROVEN: 0, 'PARTLY PROVEN': 0, 'NOT PROVEN': 1, UNTESTED: 2 };

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: 'boolean' }, out: { type: 'string' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' } },
  });
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  const cwd = process.cwd();
  const files = positionals.length ? positionals : discover(cwd);
  if (!files.length) {
    console.error('No CLAUDE.md or AGENTS.md found. Pass a file: node claims.mjs path/to/CLAUDE.md');
    return 2;
  }
  const reports = files.map((f) => proveFile(f, cwd));
  if (values.out) {
    mkdirSync(values.out, { recursive: true });
    for (const r of reports) {
      const name = r.file.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
      writeFileSync(join(values.out, `${name}.md`), toMarkdown(r));
      writeFileSync(join(values.out, `${name}.json`), `${JSON.stringify(r, null, 2)}\n`);
    }
  }
  if (values.json) console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  else console.log(reports.map(toMarkdown).join('\n---\n\n'));
  return Math.max(...reports.map((r) => EXIT[r.verdict]));
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 2;
}
