# Working on proof

- `npm test` builds `plugins/proof/skills/claude-md/scripts/proof.mjs` and its `grammars/` from `src/` and runs every test.
- `npm run gate` must pass before every commit: drift, types, tests, and no stale line in AGENTS.md or README.md. `npm run validate` must pass after any manifest change.
- Commit what `npm run build` regenerates with every change to `src/`: users run the bundle, not the sources. `npm run build:check` fails on anything stale.
- `SKILL.md` and the README tables are generated: edit `src/skill/SKILL.md.tmpl` and `src/vocabulary.ts`, never the outputs.
- `docs/spec.md` is the design spec. Its numbered acceptance criteria are tests in `test/acceptance.test.ts`; the agent stage is tested with `test/fixtures/fake-claude.mjs`, never the real CLI.
- Every rule in `src/verify/` has a test with a fixture that would fail without it. False alarms
  lose trust faster than misses, so an uncertain check reports unconfirmed, never stale.
- A check that cannot run reports not checked with the reason and keeps its statement open. Never turn an error into "not found".
- The version lives only in `package.json`; release with `npm run release -- <version>`.
- No code, paths or wording from any employer or client in fixtures or docs.
