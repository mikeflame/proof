import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expandPattern } from '../src/check.ts';
import { classifyCode, parseStatements } from '../src/parse.ts';
import { proveFile, toMarkdown, type CheckedStatement, type Report, type StatementStatus } from '../src/report.ts';

const CLAUDE_MD = `# Project

Full-stack app on Node 22+ with PostgreSQL 18.

## Commands

\`\`\`bash
bash dev.sh up          # start everything
bash dev.sh down        # stop everything
yarn dev
yarn deploy
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
\`\`\`

## Layout

- \`backend/src/middleware/\` — \`sessionContext\` loads the session.
- \`src/services/\` — business logic.
- \`src/router/\` — route aggregation.
- Shared types live in \`frontend/shared/types/api/<endpoint>.ts\`.
- Frontend uses Next.js 15 and React 18.
- \`legacyHelper\` formats dates.
- Keep endpoints thin.
- See [the guide](docs/guide.md) and [the readme](README.md).
`;

const FILES: Record<string, string> = {
  'CLAUDE.md': CLAUDE_MD,
  'README.md': '# readme\n',
  'package.json': JSON.stringify({ name: 'root', scripts: { dev: 'x', test: 'x' }, engines: { node: '>=22' } }),
  'frontend/package.json': JSON.stringify({ name: 'fe', dependencies: { next: '^15.2.0', react: '^18.3.1' } }),
  'backend/package.json': JSON.stringify({ name: 'be', scripts: { typecheck: 'tsc' } }),
  'dev.sh': '#!/usr/bin/env bash\nfunction up() {\n  echo up\n}\nfunction down-light() {\n  echo down\n}\n"$@"\n',
  'compose.yml': 'services:\n  db:\n    image: postgis/postgis:17-3.5\n',
  'backend/src/middleware/sessionContext.ts': 'export const sessionContext = () => {};\n',
  'backend/src/router/index.ts': 'export {};\n',
  'frontend/shared/types/api/getDeal.ts': 'export type GetDeal = {};\n',
};

let repo: string;
let statements: CheckedStatement[];
let result: Report;

const statusAt = (fragment: string): StatementStatus | undefined => statements.find((s) => s.text.includes(fragment))?.status;

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'proof-claims-'));
  for (const [file, body] of Object.entries(FILES)) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), body);
  }
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['add', '-A'], { cwd: repo });
  result = proveFile('CLAUDE.md', repo);
  statements = result.statements;
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe('claims proof', () => {
  it('marks what the repository contradicts as STALE, with the reason', () => {
    expect(statusAt('Node 22+ with PostgreSQL 18')).toBe('STALE');
    const pg = statements.find((s) => s.text.includes('PostgreSQL 18'))?.results.find((r) => r.kind === 'version' && r.text === 'PostgreSQL 18');
    expect(pg?.evidence).toContain('postgis/postgis:17');
    expect(statusAt('bash dev.sh down')).toBe('STALE');
    expect(statusAt('yarn deploy')).toBe('STALE');
    expect(statusAt('`src/services/`')).toBe('STALE');
    expect(statusAt('[the guide]')).toBe('STALE');
  });

  it('verifies what the repository backs, citing file and line', () => {
    expect(statusAt('bash dev.sh up')).toBe('VERIFIED');
    expect(statements.find((s) => s.text === 'bash dev.sh up')?.results[0]?.evidence).toBe('dev.sh:2 function up() {');
    expect(statusAt('yarn dev')).toBe('VERIFIED');
    expect(statusAt('sessionContext')).toBe('VERIFIED');
    expect(statusAt('`src/router/`')).toBe('VERIFIED');
    expect(statusAt('frontend/shared/types/api/<endpoint>.ts')).toBe('VERIFIED');
    expect(statusAt('Next.js 15 and React 18')).toBe('VERIFIED');
  });

  it('does not let a hyphenated function prove a shorter subcommand', () => {
    const down = statements.find((s) => s.text === 'bash dev.sh down')?.results[0];
    expect(down?.evidence).toBe('dev.sh defines no "down" subcommand');
  });

  it('separates unconfirmed names, judgment calls and external commands', () => {
    expect(statusAt('`legacyHelper`')).toBe('UNCONFIRMED');
    expect(statusAt('Keep endpoints thin')).toBe('UNCHECKED');
    expect(statusAt('sudo tee')).toBe('SKIPPED');
  });

  it('gives a NOT PROVEN report with counts and markdown', () => {
    expect(result.verdict).toBe('NOT PROVEN');
    expect(result.counts).toMatchObject({ STALE: 5, UNCONFIRMED: 1, UNCHECKED: 1, SKIPPED: 1 });
    const md = toMarkdown(result);
    expect(md).toContain('# CLAUDE.md: NOT PROVEN');
    expect(md).toContain('## Stale (5)');
    expect(md).toContain('dev.sh defines no "down" subcommand');
  });

  it('records the tree it read', () => {
    expect(result.git?.tree).toMatch(/^[0-9a-f]{40}$/);
    expect(proveFile('CLAUDE.md', repo).git?.tree).toBe(result.git?.tree);
  });

  it('gives UNTESTED for a file that does not exist', () => {
    expect(proveFile('NOPE.md', repo).verdict).toBe('UNTESTED');
  });
});

describe('claims precision on wording that only looks checkable', () => {
  let precise: CheckedStatement[];
  const resultFor = (code: string) => precise.flatMap((s) => s.results).find((r) => r.text === code);

  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), 'proof-claims-precise-'));
    const files: Record<string, string> = {
      'AGENTS.md': [
        '# Rules',
        '- Never run `helm install/upgrade` or `kubectl apply/delete` against production.',
        '- Match Prettier (`prettier/prettier`, error).',
        '- Read config, never `process.env`.',
        '- Validation lives in `<name>.schema.ts` next to each endpoint.',
        '- Migrations export `exports.up` and `exports.down`, named with an `add_` prefix.',
        '- Pitfalls are in the review skill\'s `references/pitfalls.md`.',
        '- Receipts land in `.proof/receipts/<tree>/phone/<route>/`.',
        '',
      ].join('\n'),
      '.gitignore': '.proof/\n',
      'package.json': JSON.stringify({ name: 'p' }),
      'src/endpoints/getDeal.schema.ts': 'export default {};\n',
      'src/migrations/20260101_add_users.js': 'exports.up = () => {};\nexports.down = () => {};\n',
      'skills/review/references/pitfalls.md': '# pitfalls\n',
      'skills/qa/references/checks.md': '# checks\n',
      'skills/qa/SKILL.md': 'x\n',
    };
    for (const [file, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      writeFileSync(join(dir, file), body);
    }
    execFileSync('git', ['init', '-q'], { cwd: dir });
    precise = proveFile('AGENTS.md', dir).statements;
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads "x/y" wording and lint rule ids as words, not paths', () => {
    expect(resultFor('helm install/upgrade')).toBeUndefined(); // an inline command of an external tool
    expect(resultFor('prettier/prettier')?.status).toBe('SKIPPED');
  });

  it('treats process.env as code, not a .env file', () => {
    expect(resultFor('process.env')?.kind).toBe('symbol');
  });

  it('expands placeholders before searching for a bare file name', () => {
    expect(resultFor('<name>.schema.ts')).toMatchObject({ status: 'VERIFIED', evidence: expect.stringContaining('getDeal.schema.ts') });
  });

  it('matches dotted names in full and naming prefixes in file names', () => {
    expect(resultFor('exports.up')).toMatchObject({ status: 'VERIFIED', evidence: expect.stringContaining('20260101_add_users.js:1') });
    expect(resultFor('add_')).toMatchObject({ status: 'VERIFIED', evidence: expect.stringContaining('in file names') });
  });

  it('finds a path relative to another folder before calling it missing', () => {
    expect(resultFor('references/pitfalls.md')).toMatchObject({ status: 'VERIFIED', evidence: expect.stringContaining('skills/review/references/pitfalls.md') });
  });

  it('skips generated output inside ignored folders', () => {
    expect(resultFor('.proof/receipts/<tree>/phone/<route>/')?.status).toBe('SKIPPED');
  });
});

describe('parseStatements', () => {
  it('keeps a bold tagline whole and skips lead-in lines', () => {
    const s = parseStatements('**Don\'t assume. Surface tradeoffs.**\n\nBefore implementing:\n- State your assumptions.\n');
    expect(s.map((x) => x.text)).toEqual(["Don't assume. Surface tradeoffs.", 'State your assumptions.']);
  });

  it('reads commands from shell fences but not templates from plain fences', () => {
    const s = parseStatements('```\n1. [Step] → verify: [check]\nyarn test\n```\n```bash\necho hi\n```\n');
    expect(s.map((x) => x.text)).toEqual(['yarn test', 'echo hi']);
  });

  it('takes only file-path comments from example code', () => {
    const s = parseStatements('```ts\n// src/api/getDeal.ts\nexport const x = fooBar();\n```\n');
    expect(s.map((x) => x.spans)).toEqual([[{ kind: 'path', text: 'src/api/getDeal.ts' }]]);
  });
});

describe('span helpers', () => {
  it('classifies inline code', () => {
    expect(classifyCode('bash dev.sh up')?.kind).toBe('command');
    expect(classifyCode('MODE=queue')?.kind).toBe('env');
    expect(classifyCode('backend/src/')?.kind).toBe('path');
    expect(classifyCode('.env.example')?.kind).toBe('path');
    expect(classifyCode('req.sessionId')?.kind).toBe('symbol');
    expect(classifyCode('any')).toBeNull();
    expect(classifyCode('http://localhost:3000')).toBeNull();
  });

  it('expands placeholders and alternatives', () => {
    expect(expandPattern('config/{development|test}.ts')).toEqual(['config/development.ts', 'config/test.ts']);
    expect(expandPattern('src/endpoints/*/[endpoint].schema.ts')).toEqual(['src/endpoints/*/*.schema.ts']);
    expect(expandPattern('types/api/<endpoint>.ts')).toEqual(['types/api/*.ts']);
  });
});

describe('mentions are not claims', () => {
  it('skips versions in quotes', () => {
    const [s] = parseStatements('- "Node 24+" is stale when a package needs more; we run Node 22+.\n');
    expect(s?.spans).toEqual([{ kind: 'version', text: 'Node 22+' }]);
  });

  it('honours proof:ignore for the next statement and for blocks', () => {
    const md = [
      '<!-- proof:ignore -->',
      '- Example: `src/api/<name>.ts` exists.',
      '- Real: `src/index.ts` exists.',
      '<!-- proof:ignore-start -->',
      '| Claim | Checked against |',
      '| --- | --- |',
      '| `config/{dev,prod}.ts` | the tree |',
      '```bash',
      'bash dev.sh down',
      '```',
      '<!-- proof:ignore-end -->',
      'After the block, `docs/` is checked again.',
    ].join('\n');
    expect(parseStatements(md).map((s) => s.text)).toEqual(['Real: `src/index.ts` exists.', 'After the block, `docs/` is checked again.']);
  });
});
