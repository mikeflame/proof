import { spawnSync } from 'node:child_process';
import { mkdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Run } from '../src/pipeline.ts';
import { makeRepo } from './fixtures/edge.ts';
import { checkFiles, spanOf, statementWith } from './helpers.ts';

const doc = (...lines: string[]) => `# Doc\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`;

describe('paths', () => {
  it('matches literal brackets before treating them as a pattern', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Pages: `web/pages/[slug]/index.tsx`.'), 'web/pages/[slug]/index.tsx': 'export {};\n' });
    expect(spanOf(r, 'web/pages/[slug]/index.tsx').status).toBe('VERIFIED');
  });

  it('skips ignored output even when the folder does not exist', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Builds `./bin/tool`.'), '.gitignore': 'bin/\n' });
    expect(spanOf(r, './bin/tool')).toMatchObject({ status: 'NOT_CHECKED' });
    expect(spanOf(r, './bin/tool').reason).toContain('git ignores bin/');
  });

  it('flags a missing file under a folder that exists, and a file deleted but still in the index', async () => {
    const f = makeRepo({ 'CLAUDE.md': doc('Rules in `src/check.ts`.', 'Entry `src/main.ts`.'), 'src/check.ts': 'export {};\n', 'src/other.ts': 'export {};\n' });
    try {
      unlinkSync(join(f.repo, 'src/check.ts'));
      const r = await new Run(f.repo).checkFile('CLAUDE.md');
      expect(spanOf(r, 'src/check.ts').status).toBe('STALE');
      expect(spanOf(r, 'src/main.ts').status).toBe('STALE');
    } finally {
      f.cleanup();
    }
  });

  it('flags a path missing under every folder of its first name, and finds one that moved under a sub-project', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('`src/services/` holds logic.', '`src/router/` routes.', '`vendor-docs/x.md` is upstream.'), 'backend/src/router/index.ts': 'export {};\n' });
    expect(spanOf(r, 'src/services/').status).toBe('STALE');
    expect(spanOf(r, 'src/router/').status).toBe('VERIFIED');
    expect(spanOf(r, 'vendor-docs/x.md').status).toBe('UNCONFIRMED');
  });

  it('never calls an example path, an export subpath, a method name or an unused template stale', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Run one file: `uv run pytest tests/path/test_foo.py`.', 'Public API in `core/public`.', 'Clients handle `sampling/createMessage`.', 'Guides go in `examples/guides/<section>/`.'),
      'tests/a_test.py': 'def test_a(): pass\n',
      'packages/core/package.json': JSON.stringify({ name: '@acme/core', exports: { '.': './index.js', './public': './public.js' } }),
      'packages/core/index.js': 'export {};\n',
      'packages/sampling/x.ts': 'export {};\n',
      'src/client.ts': "export const METHOD = 'sampling/createMessage';\n",
      'examples/readme.md': '# x\n',
    });
    expect(spanOf(r, 'tests/path/test_foo.py').status).toBe('NOT_CHECKED');
    expect(spanOf(r, 'core/public')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, 'sampling/createMessage')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
    expect(spanOf(r, 'examples/guides/<section>/').status).toBe('UNCONFIRMED');
    expect(r.counts.STALE).toBe(0);
  });

  it('accepts a file name the code reads at run time', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Reads `channels.json` from the CDN.'), 'update.go': 'package x\n\nconst manifest = "channels.json"\n' });
    expect(spanOf(r, 'channels.json')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
  });

  it('keeps ignore lookups working when the document names a path under a symlink', async () => {
    const f = makeRepo({ 'CLAUDE.md': doc('Skills in `.claude/skills/x/SKILL.md`.', 'Builds `bin/tool`.'), '.gitignore': 'bin/\n', '.agents/skills/x/SKILL.md': '# x\n' });
    try {
      mkdirSync(join(f.repo, '.claude'));
      symlinkSync('../.agents/skills', join(f.repo, '.claude/skills'));
      const r = await new Run(f.repo).checkFile('CLAUDE.md');
      expect(r.degraded.map((d) => d.subject)).not.toContain('git check-ignore');
      expect(spanOf(r, 'bin/tool').status).toBe('NOT_CHECKED');
    } finally {
      f.cleanup();
    }
  });

  it('reads an import path into a declared package as that package', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Import `lodash/get` directly.'), 'package.json': JSON.stringify({ dependencies: { lodash: '^4' } }) });
    expect(spanOf(r, 'lodash/get')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
  });
});

describe('commands', () => {
  it('checks a script in the folder a cd enters, and never verifies past a manifest that does not parse', async () => {
    const r = await checkFiles({ 'CLAUDE.md': '```bash\ncd api && yarn start\n```\n', 'api/package.json': '{ "scripts": { "start": "x", } }\n' });
    expect(spanOf(r, 'yarn start')).toMatchObject({ status: 'NOT_CHECKED', cwd: 'api', blocked: true });
    expect(statementWith(r, 'yarn start').status).toBe('UNVERIFIED_WITH_REASON');
    expect(r.degraded.map((d) => d.subject)).toContain('api/package.json');
  });

  it('finds a script of the sub-project the statement names', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('After changing `web/shared/` run `yarn sync`.', 'Run `yarn sync` anywhere.'),
      'package.json': JSON.stringify({ name: 'root', scripts: {} }),
      'web/package.json': JSON.stringify({ name: 'web', scripts: { sync: 'x' } }),
      'web/shared/a.ts': 'export {};\n',
    });
    expect(r.statements.find((s) => s.text.includes('After'))?.results.find((x) => x.text === 'yarn sync')?.status).toBe('VERIFIED');
    expect(r.statements.find((s) => s.text.includes('anywhere'))?.results.find((x) => x.text === 'yarn sync')?.status).toBe('UNCONFIRMED');
  });

  it('checks shell subcommands against functions and case labels in the syntax tree', async () => {
    const r = await checkFiles({
      'CLAUDE.md': '```bash\n./scripts/run.sh deploy\nbash tools/dev.sh up\nbash tools/dev.sh teardown\n```\n',
      'scripts/run.sh': '#!/usr/bin/env bash\nfunction deploy {\n  echo x\n}\n"$@"\n',
      'tools/dev.sh': '#!/usr/bin/env bash\ncase "$1" in\n  up) echo up ;;\n  down|stop) echo down ;;\nesac\n',
    });
    expect(spanOf(r, './scripts/run.sh deploy')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'bash tools/dev.sh up')).toMatchObject({ status: 'VERIFIED', level: 'definition' });
    expect(spanOf(r, 'bash tools/dev.sh teardown').status).toBe('STALE');
  });

  it('reports a make target that only a subfolder defines as unconfirmed, not stale', async () => {
    const r = await checkFiles({ 'CLAUDE.md': '```bash\nmake build\n```\n', 'web/Makefile': 'build:\n\techo b\n' });
    expect(spanOf(r, 'make build').status).toBe('UNCONFIRMED');
  });

  it('checks a program this repository builds by its subcommands', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Run `mytool answer --run x`.', 'Run `mytool vanish`.'),
      'go.mod': 'module example.com/mytool\n\ngo 1.24\n',
      'cmd/mytool/main.go': 'package main\n\nfunc main() {}\n',
      'internal/cli/answer.go': 'package cli\n\nvar use = "answer"\nvar flag = "run"\n',
    });
    expect(spanOf(r, 'mytool answer --run x')).toMatchObject({ status: 'VERIFIED', level: 'reference' });
    expect(spanOf(r, 'mytool vanish').status).toBe('UNCONFIRMED');
  });

  it('reads commands after `git clone` of this repository as running in it, and leaves other clones alone', async () => {
    const f = makeRepo({
      'README.md': '```bash\ngit clone https://github.com/acme/tool\nnode tool/bin/run.mjs\ncd tool && make build\ngit clone https://github.com/other/thing\nnode thing/x.mjs\n```\n',
      'bin/run.mjs': 'console.log(1);\n',
      'Makefile': 'build:\n\techo b\n',
    });
    try {
      spawnSync('git', ['remote', 'add', 'origin', 'git@github.com:acme/tool.git'], { cwd: f.repo });
      const r = await new Run(f.repo).checkFile('README.md');
      expect(spanOf(r, 'node bin/run.mjs').status).toBe('VERIFIED');
      expect(spanOf(r, 'make build').status).toBe('VERIFIED');
      expect(spanOf(r, 'node thing/x.mjs').reason).toContain('fresh clone of https://github.com/other/thing');
      expect(r.counts.STALE).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it('reads a file name with two extensions as a file, not a qualified name', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Edit `src/skill/SKILL.md.tmpl`.'), 'src/skill/SKILL.md.tmpl': '# t\n' });
    expect(spanOf(r, 'src/skill/SKILL.md.tmpl')).toMatchObject({ kind: 'path', status: 'VERIFIED' });
  });

  it('leaves external tools unchecked without blocking the statement', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Uses `gh`.') });
    expect(spanOf(r, 'gh')).toMatchObject({ status: 'NOT_CHECKED' });
    expect(spanOf(r, 'gh').blocked).toBeUndefined();
  });
});

describe('values and dependencies', () => {
  it('needs the value in the same declaration as the variable', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Worker: `MODE=queue`.', 'API: `ROLE=api`.'),
      'compose.yml': 'services:\n  worker:\n    environment:\n      MODE: queue\n',
      'src/a.ts': 'const role = process.env.ROLE;\n// the api of things\n',
    });
    expect(spanOf(r, 'MODE=queue')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, 'ROLE=api').status).toBe('UNCONFIRMED');
  });

  it('compares a version floor with the strictest one the repository declares', async () => {
    const r = await checkFiles({ 'CLAUDE.md': doc('Requires Node 24+.'), 'package.json': JSON.stringify({ engines: { node: '>=26' } }) });
    expect(spanOf(r, 'Node 24+').status).toBe('STALE');
  });

  it('looks up products and scoped packages in manifests', async () => {
    const r = await checkFiles({
      'CLAUDE.md': doc('Payments go through Stripe.', 'Styling uses `@mui/material/styles`.', 'Never `@material-ui/*`.'),
      'package.json': JSON.stringify({ dependencies: { stripe: '^14', '@mui/material': '^5' } }),
    });
    expect(spanOf(r, 'Stripe')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, '@mui/material')).toMatchObject({ status: 'VERIFIED', level: 'declaration' });
    expect(spanOf(r, '@material-ui/*').status).toBe('UNCONFIRMED');
  });
});
