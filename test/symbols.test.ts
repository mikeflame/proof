import { describe, expect, it } from 'vitest';
import { checkFiles, spanOf } from './helpers.ts';

const doc = (...lines: string[]) => `# Doc\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`;

describe('evidence ladder', () => {
  it('verifies a definition and never a comment', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`handleRequest` handles it.', '`ghostHelper` handles it.'),
      'src/a.ts': 'export function handleRequest() {}\n// ghostHelper was here once\n',
    });
    expect(spanOf(r, 'handleRequest')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'ghostHelper')).toMatchObject({ status: 'UNCONFIRMED', level: 'comment' });
  });

  it('does not count a name inside a message string', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`pr.base_branch` sets the base.'),
      'src/a.ts': 'throw new Error("pr.base_branch is not valid here");\n',
    });
    expect(spanOf(r, 'pr.base_branch').status).not.toBe('VERIFIED');
  });

  it('reads exact string constants, serialization tags and SQL columns as declarations', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Verdict `no-surface` parks.', '`allow_repo_commands` opts in.', '`runs.parked_ms` records the park.'),
      'types.go': 'package x\n\nconst VerdictNoSurface = "no-surface"\n\ntype Config struct {\n\tAllow bool `yaml:"allow_repo_commands"`\n}\n',
      'schema.go': 'package x\n\nconst schema = `\nCREATE TABLE IF NOT EXISTS runs (\n    id TEXT PRIMARY KEY,\n    parked_ms INTEGER\n);\n`\n',
    });
    expect(spanOf(r, 'no-surface')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, 'allow_repo_commands')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, 'runs.parked_ms')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
  });

  it('does not take a column of another table', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`jobs.parked_ms` records the park.'),
      'schema.sql': 'CREATE TABLE runs (\n  parked_ms INTEGER\n);\n',
    });
    expect(spanOf(r, 'jobs.parked_ms').status).not.toBe('VERIFIED');
  });
});

describe('generated files', () => {
  it('never takes evidence from files .gitattributes marks generated, or from minified bundles', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`onlyInBundle` is exported.'),
      '.gitattributes': 'dist/app.js linguist-generated=true\n',
      'dist/app.js': 'export function onlyInBundle() {}\n',
      'web/vendor.min.js': 'function onlyInBundle(){}\n',
    });
    expect(spanOf(r, 'onlyInBundle').status).toBe('UNCONFIRMED');
  });
});

describe('qualified and member names', () => {
  it('resolves a package path qualified name to its definition', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Tests use `internal/testgit.RealGit`.'),
      'internal/testgit/testgit.go': 'package testgit\n\n// RealGit runs git.\nfunc RealGit() string { return "git" }\n',
    });
    expect(spanOf(r, 'internal/testgit.RealGit')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(r.counts.STALE).toBe(0);
  });

  it('resolves Type.member through the owning type, in Go and TypeScript', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`Executor.Resume` resumes.', '`Store.flush` flushes.', '`Other.Resume` resumes.'),
      'exec.go': 'package x\n\ntype Executor struct{}\n\nfunc (e *Executor) Resume() {}\n\ntype Runner struct{}\n',
      'store.ts': 'export class Store {\n  flush(): void {}\n}\n',
    });
    expect(spanOf(r, 'Executor.Resume')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'Store.flush')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'Other.Resume').status).toBe('UNCONFIRMED');
  });

  it('never verifies a dotted name by its last part alone', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('The id comes from `req.sessionId`.'),
      'src/a.ts': 'export const f = (x: { sessionId: string }) => x.sessionId;\n',
    });
    expect(spanOf(r, 'req.sessionId')).toMatchObject({ status: 'UNCONFIRMED', level: 'substring' });
  });

  it('reads `lib.method()` as a call when a same-named folder lacks the method', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Read secrets with `config.get()`.'),
      'config/default.ts': 'export default { port: 1 };\n',
      'src/a.ts': "import config from 'config';\nexport const port = config.get('port');\n",
    });
    expect(spanOf(r, 'config.get()')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
  });

  it('finds the definition of a function named with ()', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Wrap with `checkSchema()`.'),
      'src/validate.ts': 'export function checkSchema(s: unknown) { return s; }\n',
    });
    expect(spanOf(r, 'checkSchema()')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
  });
});

describe('config keys', () => {
  it('finds a key path in a YAML file and through Go struct tags', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('`review.timeout` bounds it.', '`pr.base_branch` sets the base.'),
      'config.example.yaml': 'review:\n  timeout: 5m\n',
      'config.go': 'package x\n\ntype Config struct {\n\tPR PRConfig `yaml:"pr"`\n}\n\ntype PRConfig struct {\n\tBaseBranch string `yaml:"base_branch"`\n}\n',
    });
    expect(spanOf(r, 'review.timeout')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, 'pr.base_branch')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
  });
});

describe('names that live outside identifiers', () => {
  it('matches a kebab name to a folder', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Owner: `ci-monitor`.'), '.agents/skills/ci-monitor/SKILL.md': '# x\n' });
    expect(spanOf(r, 'ci-monitor')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
  });

  it('needs a flag as an exact string, not in some other tool’s command line', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Pass `--keep-local` to keep it.', 'Never `--force-all`.'),
      'cli.go': 'package x\n\nvar flagName = "keep-local"\n',
      'release.sh': 'codesign --force-all app\n',
    });
    expect(spanOf(r, '--keep-local')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
    expect(spanOf(r, '--force-all').status).toBe('UNCONFIRMED');
  });

  it('finds a naming prefix at the start of names', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Rename with the `deprecated_` prefix.'),
      'migrations/1.js': "exports.up = (knex) => knex.schema.renameTable('prices', 'deprecated_prices');\n",
    });
    expect(spanOf(r, 'deprecated_')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
  });

  it('checks a Go subtest by its name', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Covered by `TestReview/conversation_off`.', 'And `TestReview/missing_case`.'),
      'r_test.go': 'package x\n\nimport "testing"\n\nfunc TestReview(t *testing.T) {\n\tt.Run("conversation off", func(t *testing.T) {})\n}\n',
    });
    expect(spanOf(r, 'TestReview/conversation_off')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'TestReview/missing_case').status).toBe('UNCONFIRMED');
  });
});

describe('slash commands', () => {
  it('finds a skill, a command and a plugin skill, and leaves built-ins alone', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Run `/deploy`.', 'Run `/tools:audit`.', 'Run `/vanished`.', 'Run `/init` first.', 'Routes mount under `/api`.'),
      '.claude/commands/deploy.md': '# deploy\n',
      'src/app.ts': "app.use('/api', router);\n",
      'plugins/tools/.claude-plugin/plugin.json': JSON.stringify({ name: 'tools' }),
      'plugins/tools/skills/audit/SKILL.md': '---\nname: audit\n---\n',
    });
    expect(spanOf(r, '/deploy')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, '/tools:audit')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, '/vanished').status).toBe('UNCONFIRMED');
    expect(spanOf(r, '/init').status).toBe('NOT_CHECKED');
    expect(spanOf(r, '/api')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
  });
});

describe('absence checks', () => {
  it('verifies what is gone, flags what is still defined, and doubts what is only used', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('The `waitingOn` block was deleted.', 'The `formatRow` helper was removed.', 'The `review_questions` block was removed.'),
      'a.ts': 'export function formatRow() {}\n',
      'db.go': 'package x\n\nconst q = `INSERT INTO review_questions (id) VALUES (?)`\n',
    });
    expect(spanOf(r, 'waitingOn')).toMatchObject({ status: 'VERIFIED', expect: 'absent' });
    expect(spanOf(r, 'formatRow')).toMatchObject({ status: 'STALE', expect: 'absent' });
    expect(spanOf(r, 'review_questions')).toMatchObject({ status: 'UNCONFIRMED', expect: 'absent' });
  });
});

describe('lookups that fail', () => {
  it('keep the span open with the error instead of reading it as nothing found', async () => {
    const { Run } = await import('../src/pipeline.ts');
    const { makeRepo } = await import('./fixtures/edge.ts');
    const f = makeRepo({ 'CLAUDE.md': doc('`Executor.Resume` resumes.', 'Reads `channels.json`.', '`runs.parked_ms` is set.', 'Mounted at `/api`.'), 'a.go': 'package x\n' });
    try {
      const run = new Run(f.repo);
      // An invalid pathspec makes every git grep fail.
      (run.repo as unknown as { generated: string[] }).generated = [':(exclude,bad)x'];
      const r = await run.checkFile('CLAUDE.md');
      for (const text of ['Executor.Resume', 'channels.json', 'runs.parked_ms', '/api']) {
        expect(spanOf(r, text), text).toMatchObject({ status: 'NOT_CHECKED', blocked: true });
        expect(spanOf(r, text).reason, text).toContain('lookup failed');
      }
    } finally {
      f.cleanup();
    }
  });
});
