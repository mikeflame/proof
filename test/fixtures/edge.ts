// The synthetic edge repository of spec 1.3, built in a temporary folder so the broken manifest and
// the instruction files never become part of this repository's own run.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const EDGE_DOC = `# Edge

@README.md
@docs/missing.md

## Commands

\`\`\`bash
cd api && yarn start
./scripts/run.sh deploy
bash tools/dev.sh up
bash tools/dev.sh teardown
make build
./bin/no-mistakes
\`\`\`

## Facts

- Requires Node 24+.
- Run the worker with \`MODE=queue\`.
- The session id comes from \`req.sessionId\`.
- Deal pages live in \`web/pages/deals/[slug]/index.tsx\`.
- The \`waiting_on\` block was deleted.
- The \`retry_budget\` setting was removed.
- See [the outside notes](../outside.md) and [style rules](.claude/rules/style.md).
- Lint rules are in \`web/eslint.config.js\`.
`;

export const EDGE_FILES: Record<string, string> = {
  'CLAUDE.md': EDGE_DOC,
  'README.md': '# Edge repo\n',
  '.gitignore': 'bin/\nnode_modules/\n',
  'package.json': JSON.stringify({ name: 'edge', private: true, engines: { node: '>=26' }, scripts: { build: 'tsc' } }, null, 2),
  'api/package.json': '{ "name": "api", "scripts": { "start": "node index.js", }\n',
  'api/index.ts': [
    "const mode = process.env.MODE;",
    "// the queue of things to do",
    "export function handle(x: { sessionId: string }) {",
    "  return x.sessionId;",
    "}",
    "export const retryBudget = 3;",
    '',
  ].join('\n'),
  'tools/dev.sh': [
    '#!/usr/bin/env bash',
    'case "$1" in',
    '  up) docker compose up -d ;;',
    '  down|stop) docker compose down ;;',
    '  *) echo "usage: dev.sh up|down" ;;',
    'esac',
    '',
  ].join('\n'),
  'scripts/run.sh': ['#!/usr/bin/env bash', 'function deploy {', '  echo deploying', '}', '"$@"', ''].join('\n'),
  'web/Makefile': 'build:\n\techo build\n',
  'web/pages/deals/[slug]/index.tsx': 'export default function Deal() { return null; }\n',
  'web/eslint.config.js': 'export default [];\n',
  '.claude/rules/style.md': '---\npaths:\n  - "web/**/*.tsx"\n---\n\n- Components use named exports.\n',
  'CLAUDE.local.md': '- My local notes live in `notes/`.\n',
};

export interface Fixture {
  root: string;
  repo: string;
  cleanup(): void;
}

/** Write files into a fresh git repository; `outside` files go one level above it. */
export function makeRepo(files: Record<string, string>, outside: Record<string, string> = {}): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'proof-fixture-'));
  const repo = join(root, 'repo');
  const write = (base: string, all: Record<string, string>) => {
    for (const [file, body] of Object.entries(all)) {
      mkdirSync(dirname(join(base, file)), { recursive: true });
      writeFileSync(join(base, file), body);
    }
  };
  mkdirSync(repo);
  write(repo, files);
  write(root, outside);
  const git = (...args: string[]) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  // CI runners have no git identity; commits made by the code under test need one.
  git('config', 'user.name', 'fixture');
  git('config', 'user.email', 'fixture@example.com');
  git('config', 'commit.gpgsign', 'false');
  git('add', '-A');
  git('-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-q', '-m', 'fixture');
  return { root, repo, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

export const makeEdgeRepo = (): Fixture => makeRepo(EDGE_FILES, { 'outside.md': '# Outside the repository\n' });
