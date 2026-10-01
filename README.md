# proof

**Your CLAUDE.md is the first thing every agent session reads. `/proof:claude-md` proves it is still true.**

Instruction files go stale quietly. A folder moves, a script is renamed, the Node version goes
up, and every new session starts from the wrong map before the task even begins. An outdated
CLAUDE.md is worse than a short one.

`/proof:claude-md` checks every statement in `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, the files
they `@import`, and the instruction files of Copilot, Cursor, Gemini, Windsurf, Cline and Aider
against the repository, cites the evidence for each with its strength, and proposes the edit.

## What it finds

```
# CLAUDE.md: NOT PROVEN

3 stale · 0 unconfirmed · 1 unverified · 3 verified · 0 not checked

evidence: definition 3, declaration 2

## Stale (3)

- **L3** Full-stack app on Node 22+ with PostgreSQL 18.
  - ✗ `Node 22+` — the repository requires Node 24: package.json engines.node ">=24"
  - ✓ [declaration] `PostgreSQL 18` — compose.yml postgis/postgis:18
- **L9** bash dev.sh down # stop everything
  - ✗ `bash dev.sh down` — dev.sh defines no "down" function or case label (it has up, down-light)
- **L14** `src/services/` — business logic.
  - ✗ `src/services/` — not found: no services under any src/ folder (backend/src)

## Unverified with reason (1)

- **L15** `src/router/` — route aggregation.
  - names verified; still to check: description "route aggregation"
  - ✓ [definition] `src/router/` — found at backend/src/router, not relative to CLAUDE.md
```

Then `proof run` does the part a parser can't: a verifier agent reads every statement the checks
left open, opens the files, recounts, and answers with citations. proof keeps a verdict only when
every citation checks out: it re-reads each `file:line` and re-runs each read-only command. On the
65 open statements of a public Go repository's AGENTS.md, a run took 5.5 minutes and $3.27, proved
57 with checked citations, left 6 open with reasons, and found 2 real contradictions with the code
that no name check could see.

## Install

The repository is private for now; these commands work for collaborators until it is public.

**Claude Code** (plugin):

```bash
claude plugin marketplace add mikeflame/proof
claude plugin install proof@proof
```

Then run `/proof:claude-md` in any repository.

**Other agents**: copy `plugins/proof/skills/claude-md/` into your agent's skills directory. The
skill tells the agent to run `scripts/proof.mjs` from that folder.

**Just the check**, no agent: `node plugins/proof/skills/claude-md/scripts/proof.mjs check` in
your repository. It needs Node 22+ and git; the parsers and grammars ship next to it.
`proof.mjs run` adds the verifier and needs the `claude` CLI (or `PROOF_CLAUDE` set to its path).

## What it checks

<!-- proof:ignore-start reason="the left column shows the kinds of claims proof reads, not facts about this repository" -->
| In the file | Checked against |
| --- | --- |
| paths, globs and links | the file tree, from the repo root, the file's folder, each package folder and the folder a `cd` enters; literal `[slug]` segments first |
| `yarn` / `npm` / `pnpm` / `bun` scripts, `make`, `just`, `task`, `cargo`, `go`, `docker compose` and more | the scripts, targets, tasks, aliases and services each tool reads, in the folder the command runs in |
| `bash dev.sh <subcommand>` | functions and `case` labels in the script's syntax tree |
| "Node 24+", "Python 3.12", "PostgreSQL 18" | the strictest floor in `engines`, `.nvmrc`, `.tool-versions`, `pyproject`, `go.mod`, Dockerfiles and compose images |
| identifiers, `pkg.Symbol`, `Type.member` | definitions in a syntax tree first, then references; comments never count |
| config keys, columns, enum values (`pr.base_branch`, `runs.parked_ms`, `no-surface`) | YAML/TOML/JSON keys, struct tags, SQL schema, exact string constants |
| `MODE=queue` | a declaration with that value, or code that reads and compares it |
| "Stripe", `@mui/material` | manifests across ecosystems |
| "the `x` block was deleted" | absence: stale only if `x` is still defined |
| `@docs/api.md` imports | the imported file, checked in turn, four hops deep, as Claude Code loads it |
| a rule's `paths:` (`globs:`, `applyTo:`) | the files each pattern matches, read with Claude Code's glob rules (`[` is a bracket expression) |
<!-- proof:ignore-end -->

Each statement comes back **stale** (the repository contradicts it), **unconfirmed** (part of it
has no evidence), **unverified with reason** (the names check out, and the reason says what is
left for a reader), **overridden** (an ignore marker with a reason), **verified**, or **not
checked** (system files, external tools). Every verified span names its evidence level:
definition, declaration or reference. A match in a comment or inside a longer string never
verifies anything.

The verdict is NOT PROVEN when anything is stale, PARTLY PROVEN while anything is open, and PROVEN
only when every statement is verified. A check that cannot run fully, such as a manifest that does
not parse, is named in a `degraded:` header line and keeps its statements open. It warns when
your checkout is behind its upstream, and writes nothing into your repository.

Exit codes: `0` PROVEN, PROVEN WITH OVERRIDES or PARTLY PROVEN; `1` NOT PROVEN; `2` unreadable file or usage error.

## How it stays precise

Tuned on large real instruction files, where every false alarm costs trust:

<!-- proof:ignore-start reason="examples of inputs proof handles, quoted from other repositories" -->
- an uncertain check reports unconfirmed, never stale; a lookup that errors keeps its statement open
- `internal/testgit.RealGit` is a Go name, not a path; `req.sessionId` must match in full, never by its last part
- `Executor.Resume` is verified only when the syntax tree shows `Resume` defined on `Executor`
- a name in an error message or a help string is a mention, like a comment
- `cd api && yarn start` is checked as `yarn start` in `api/`; `go build -o ./bin/x` does not claim `./bin/x` exists
- a `make` target defined only in a subfolder is unconfirmed, not stale; ignored output is skipped
- "Node 24+" is stale as soon as any source requires more
<!-- proof:ignore-end -->

## Development

```bash
npm install
npm test            # builds the bundle and grammars, then runs every test against both
npm run typecheck
npm run validate    # claude plugin validate for the marketplace and the plugin
```

The skill ships `scripts/proof.mjs` and `scripts/grammars/`, built from `src/` by `scripts/build.mjs`.
Commit them after `npm run build`. `docs/rework-spec.md` is the working spec.

## License

MIT
