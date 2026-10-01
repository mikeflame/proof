# proof

**Your CLAUDE.md is the first thing every agent session reads. `/proof:claude-md` proves it is still true.**

Instruction files go stale quietly. A folder moves, a script is renamed, the Node version goes
up, and every new session starts from the wrong map before the task even begins. An outdated
CLAUDE.md is worse than a short one.

`/proof:claude-md` checks every statement in `CLAUDE.md` and `AGENTS.md` against the repository,
cites the evidence for each, sorts what a machine can't check into rules and facts, and proposes
the edit.

## What it finds

```
# CLAUDE.md: NOT PROVEN

3 stale · 0 unconfirmed · 1 need judgment · 3 verified · 0 not checked

## Stale (3)

- L3 Full-stack app on Node 22+ with PostgreSQL 18.
  - ✗ `Node 22+` — the repository requires Node 24: package.json engines.node ">=24"
  - ✓ `PostgreSQL 18` — compose.yml postgis/postgis:18
- L9 bash dev.sh down
  - ✗ `bash dev.sh down` — dev.sh defines no "down" subcommand
- L15 `src/services/` — business logic.
  - ✗ `src/services/` — not found: src/services/

## Verified (3)

- L8 bash dev.sh up
  - ✓ `bash dev.sh up` — dev.sh:2 function up() {
```

Then the agent does the part a script can't: it judges the remaining lines, re-reads verified
ones that state status or purpose, and proposes a diff, which it applies only when you say so.

```diff
-Full-stack app on Node 22+ with PostgreSQL 18.
+Backend service on Node 24+ with PostgreSQL 18 (PostGIS).
-bash dev.sh down        # stop everything
+bash dev.sh down-light  # stop everything
-- `src/services/` — business logic.
-- `src/router/` — route aggregation.
+- `backend/src/router/` — route aggregation.
```

## Install

**Claude Code** (plugin):

```bash
claude plugin marketplace add mikeflame/proof
claude plugin install proof@proof
```

Then run `/proof:claude-md` in any repository.

**Claude Code** (plain skill): copy `plugins/proof/skills/claude-md/` to `~/.claude/skills/claude-md/`
and run `/claude-md`.

**Other agents**: copy the same folder into your agent's skills directory. The skill tells the
agent to run `scripts/claims.mjs` from that folder.

**Just the check**, no agent: `node plugins/proof/skills/claude-md/scripts/claims.mjs` in your
repository. It needs Node 22+ and git, and has no dependencies.

## What it checks

<!-- proof:ignore-start -->
| In the file | Checked against |
| --- | --- |
| paths and globs (`src/api/<name>.ts`, `config/{dev,prod}.ts`) | the file tree, from the repo root, the file's folder and each package folder |
| `yarn` / `npm` / `pnpm` scripts | every `package.json` |
| `bash dev.sh <subcommand>`, `make <target>` | the functions, case labels and targets the script defines |
| "Node 24+", "Next.js 15", "PostgreSQL 18" | `engines`, `.nvmrc`, dependencies, Docker and compose images |
| identifiers and env vars (`sessionContext`, `MODE=queue`) | code and file names, via `git grep`, citing `file:line` |
| links | the files they point to |
<!-- proof:ignore-end -->

Each statement comes back **stale** (the repository contradicts it), **unconfirmed** (no
evidence), **verified**, **not checked** (system files, external tools) or **needs judgment**
(rules and descriptions). The verdict is NOT PROVEN when anything is stale, and PARTLY PROVEN
until someone has judged the rest. It never reports green by default, warns when your checkout
is behind its upstream, and writes nothing into your repository.

Exit codes: `0` PROVEN or PARTLY PROVEN, `1` NOT PROVEN, `2` missing file or usage error.

## How it stays precise

It was tuned by running it on large real instruction files, where every false alarm costs trust:

- a lookup that errors is reported as skipped, never as "not found"
- `down-light` does not prove that a `down` subcommand exists
- "Node 24+" is stale as soon as any package requires more
- a missing leaf under an existing folder is stale; a path whose first folder doesn't exist
  probably names somewhere else, so it is unconfirmed
- paths inside ignored folders are generated output, not claims
- `exports.up` must match in full, never by its last word; `process.env` is code, not a file;
  `helm install/upgrade` and `prettier/prettier` are words, not paths

## Development

```bash
npm install
npm test           # builds the bundled script, then runs the tests against it and the sources
npm run validate   # claude plugin validate for the marketplace and the plugin
```

The skill ships `scripts/claims.mjs`, built from `src/` with esbuild. Commit it after `npm run build`.

## License

MIT
