# Working on proof

- `npm test` builds `plugins/proof/skills/claude-md/scripts/proof.mjs` and its `grammars/` from `src/` and runs every test.
- `npm run typecheck` must print nothing. `npm run validate` must pass after any manifest change.
- Commit the rebuilt `scripts/proof.mjs` and `scripts/grammars/` with every change to `src/`: users run the bundle, not the sources.
- `docs/rework-spec.md` is the working spec. Its numbered acceptance criteria are tests in `test/acceptance.test.ts`; the agent stage is tested with `test/fixtures/fake-claude.mjs`, never the real CLI.
- Every rule in `src/verify/` has a test with a fixture that would fail without it. False alarms
  lose trust faster than misses, so an uncertain check reports unconfirmed, never stale.
- A check that cannot run reports not checked with the reason and keeps its statement open. Never turn an error into "not found".
- Keep `src/version.ts`, `package.json` and `plugins/proof/.claude-plugin/plugin.json` on the same version.
- No code, paths or wording from any employer or client in fixtures or docs.
