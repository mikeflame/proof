import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type Discovered, discover } from './discover.ts';
import { EXIT_CODE } from './model.ts';
import { proposeGaps } from './agent/gaps.ts';
import { DEFAULT_VERIFY, MIN_CALL_USD, type VerifyOptions } from './agent/verify.ts';
import { annotateFixes, type FileFix, type FileReport, Run } from './pipeline.ts';
import { loadConfig } from './config.ts';
import { sidecarPath } from './decisions.ts';
import { decide, HumanError, listOpen, revert } from './human.ts';
import { install } from './install.ts';
import { toMarkdown } from './report.ts';
import { VERSION } from './version.ts';
import { renderHelp } from './vocabulary.ts';

export const HELP = renderHelp(VERSION);

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
      'dry-run': { type: 'boolean' },
      'fix-rounds': { type: 'string' },
      gaps: { type: 'boolean' },
      commit: { type: 'boolean' },
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
    let spent = reports.reduce((n, r) => n + (r.agent?.costUsd ?? 0), 0);
    const rounds = NUMBER('fix-rounds', values['fix-rounds'], 1);
    const dryRun = Boolean(values['dry-run']);
    const config = loadConfig(run.repo);
    let current = run;
    const merged = new Map<string, FileFix>();
    // One bounded round by default; a later round sees every rejected attempt and the re-verifier's verdict on it.
    for (let round = 1; round <= rounds && !values['no-fix'] && reports.some((r) => r.counts.STALE); round++) {
      const stale = reports.reduce((n, r) => n + r.counts.STALE, 0);
      // Every stage draws on what the run has left: --budget-usd is the run's total.
      const left = opts.budgetUsd - spent;
      if (left < MIN_CALL_USD) {
        for (const r of reports.filter((x) => x.counts.STALE)) r.degraded.push({ subject: 'fix', reason: `the budget of $${opts.budgetUsd.toFixed(2)} was spent before fixing: raise --budget-usd` });
        break;
      }
      if (!values.json) console.error(`fixing ${stale} stale statement(s)${rounds > 1 ? ` (round ${round} of ${rounds})` : ''}${dryRun ? ' (dry run: nothing is written)' : ''}`);
      const fixes = await current.fix(reports, { model: opts.model, effort: opts.effort, budgetUsd: Math.min(left, Math.max(1, stale * opts.perStatementUsd * 2)), timeoutMs: opts.timeoutMs, user: Boolean(values.user), config, dryRun, verify: { ...opts, budgetUsd: left } });
      spent += [...fixes.values()].reduce((n, x) => n + x.costUsd, 0);
      const changed = [...fixes.values()].some((f) => f.after !== f.before || f.accepted.length || f.rejected.length);
      if (changed && !dryRun) {
        // The files changed: check them again; the verdict cache answers every statement that did not.
        current = new Run(process.cwd());
        reports = await current.verify(await current.checkTargets(targets, { user: Boolean(values.user) }), { ...opts, budgetUsd: Math.max(0, opts.budgetUsd - spent) });
        spent += reports.reduce((n, r) => n + (r.agent?.costUsd ?? 0), 0);
        if (values.commit) commitFixes(current.repo.root, [...fixes.entries()].filter(([, f]) => f.after !== f.before || f.rejected.length).map(([file]) => file), fixes);
      }
      for (const [file, f] of fixes) {
        const prev = merged.get(file);
        merged.set(file, prev ? { ...f, before: prev.before, proposed: [...prev.proposed, ...f.proposed], accepted: [...prev.accepted, ...f.accepted], rejected: [...prev.rejected, ...f.rejected], costUsd: prev.costUsd + f.costUsd, reverified: new Map([...prev.reverified, ...f.reverified]) } : f);
      }
      if (dryRun || !fixes.size || ![...fixes.values()].some((f) => f.rejected.length)) break;
    }
    if (merged.size) annotateFixes(reports, merged, dryRun);
    for (const [file, f] of merged) if (f.failure) reports.find((r) => r.file === file)?.degraded.push({ subject: 'fix', reason: f.failure });
    if (values.gaps) {
      // Proposals only: nothing here writes to any file (spec 5.4).
      for (const r of reports.filter((x) => x.scope !== 'managed' && x.statements.length)) {
        if (opts.budgetUsd - spent < MIN_CALL_USD) {
          r.degraded.push({ subject: 'gaps', reason: `the budget of $${opts.budgetUsd.toFixed(2)} was spent before gap proposals: raise --budget-usd` });
          continue;
        }
        const g = await proposeGaps(current.repo, r.file, current.repo.read(r.file) ?? '', { model: opts.model, effort: opts.effort, budgetUsd: Math.min(1, opts.budgetUsd - spent), timeoutMs: opts.timeoutMs });
        spent += g.costUsd;
        r.gaps = g.proposals;
        if (g.failure) r.degraded.push({ subject: 'gaps', reason: `gap proposals failed: ${g.failure}` });
      }
    }
    for (const r of reports) r.run.budgetUsedUsd = spent;
    if (!values.json) console.error(`spent $${spent.toFixed(2)} of $${opts.budgetUsd.toFixed(2)}`);
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

/** `--commit`: the fixed files and their sidecars only, never anything else that is staged. */
function commitFixes(root: string, files: string[], fixes: Map<string, FileFix>): void {
  const paths = files.flatMap((f) => [f, sidecarPath(f)]).filter((p) => existsSync(join(root, p)));
  if (!paths.length) return;
  const applied = [...fixes.values()].reduce((n, f) => n + f.accepted.length, 0);
  spawnSync('git', ['add', '--', ...paths], { cwd: root });
  const res = spawnSync('git', ['commit', '-q', '-m', `docs: proof fixed ${applied} stale statement${applied === 1 ? '' : 's'} in ${files.join(', ')}`, '--', ...paths], { cwd: root, encoding: 'utf8' });
  if (res.status !== 0) console.error(`commit failed: ${res.stderr.trim()}. The fixes are in the working tree.`);
}

async function decideCommand(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { rule: { type: 'boolean' }, fact: { type: 'boolean' }, reason: { type: 'string' }, evidence: { type: 'string', multiple: true }, by: { type: 'string' } } });
  const [file, which] = positionals;
  if (!file) throw new UsageError('proof decide needs a file');
  const run = new Run(process.cwd());
  if (!which) {
    process.stdout.write(await listOpen(run, file));
    return 0;
  }
  if (values.rule === values.fact) throw new UsageError('pass exactly one of --rule or --fact');
  const record = await decide(run, file, which, { kind: values.rule ? 'rule' : 'fact', reason: values.reason ?? '', evidence: (values.evidence ?? []).flatMap((e) => e.split(',')), ...(values.by ? { by: values.by } : {}) });
  console.log(`decided ${record.kind}: ${record.text}\nrecorded in ${sidecarPath(run.repo.rel(file) ?? file)}`);
  return 0;
}

function revertCommand(argv: string[]): number {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { id: { type: 'string' }, by: { type: 'string' } } });
  const [file] = positionals;
  if (!file || !values.id) throw new UsageError('proof revert needs a file and --id <statement id>');
  const run = new Run(process.cwd());
  const record = revert(run, file, values.id, values.by);
  console.log(`reverted: ${record.edit?.new || '(deleted text)'} → ${record.edit?.old}\nrecorded as fix-rejected in ${sidecarPath(run.repo.rel(file) ?? file)}`);
  return 0;
}

function installCommand(argv: string[]): number {
  const { values } = parseArgs({ args: argv, options: { claude: { type: 'boolean' }, agents: { type: 'boolean' } } });
  const which = values.claude || values.agents ? (['claude', 'agents'] as const).filter((k) => values[k]) : (['claude', 'agents'] as const);
  const results = install([...which]);
  for (const r of results) console.log(`${r.state.padEnd(9)} ${r.target} (${r.note})`);
  if (results.some((r) => r.state !== 'refused')) console.log('Run it in any repository: /claude-md in Claude Code, or ask your agent to use the claude-md skill.');
  return results.some((r) => r.state === 'refused') ? 2 : 0;
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
    if (first === 'decide') return await decideCommand(rest);
    if (first === 'revert') return revertCommand(rest);
    if (first === 'install') return installCommand(rest);
    // `proof CLAUDE.md` and `proof --json` mean `proof check …`.
    if (!first || first.startsWith('-') || /\.(md|mdc)$|rules$/i.test(first)) return await pipeline('check', argv);
  } catch (err) {
    if (err instanceof HumanError) {
      console.error(err.message);
      return 2;
    }
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
