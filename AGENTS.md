# Working on proof

- `npm test` builds `plugins/proof/skills/claude-md/scripts/claims.mjs` from `src/` and runs every test.
- `npm run typecheck` must print nothing. `npm run validate` must pass after any manifest change.
- Commit the rebuilt `scripts/claims.mjs` with every change to `src/`: users run the bundle, not the sources.
- The bundle has no dependencies. Keep it that way: Node built-ins and the git CLI only.
- Every rule in `src/check.ts` has a test with a fixture that would fail without it. False alarms
  lose trust faster than misses, so an uncertain check reports unconfirmed, never stale.
- A lookup that fails reports skipped with the error. Never turn an error into "not found".
- Keep `src/version.ts`, `package.json` and `plugins/proof/.claude-plugin/plugin.json` on the same version.
- No code, paths or wording from any employer or client in fixtures or docs.
