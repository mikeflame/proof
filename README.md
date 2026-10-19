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

Then it fixes what is stale. A fixer proposes each edit from the evidence alone, proof applies its
policy (never add a line, never delete a rule, delete a fact only with evidence it is gone, cite
everything), and a fresh verifier re-checks the edited text. Edits it refuses are reverted and
reported. Every fix and every decision you record with `proof decide` goes into a sidecar
(`CLAUDE.md.proof.json`), so the next run shows decided lines as decided and asks only about what
changed. You review the diff afterwards; nothing is committed unless you pass `--commit`.

## Install

**Claude Code** (plugin):

```bash
claude plugin marketplace add mikeflame/proof
claude plugin install proof@proof
```

Then run `/proof:claude-md` in any repository.

**Any agent**, in two commands:

```bash
git clone https://github.com/mikeflame/proof
node proof/plugins/proof/skills/claude-md/scripts/proof.mjs install
```

`install` copies the skill to `~/.claude/skills/claude-md/` and `~/.agents/skills/claude-md/` (the
layout Codex, OpenCode and Pi read), and leaves both alone when they are already current.

**Just the check**, no agent: `node plugins/proof/skills/claude-md/scripts/proof.mjs check` in
your repository. It needs Node 22+ and git; the parsers and grammars ship next to it.
`proof.mjs run` adds the verifier and needs the `claude` CLI (or `PROOF_CLAUDE` set to its path).

## What it can touch

`proof check` runs no agent and writes nothing. `proof run` hands what the checks leave open to
`claude -p` calls, and runs each of them locked down:

- Read-only tools: Read, Grep, Glob, and Bash limited to read-only commands such as `git log`,
  `git grep`, `ls`, `find`, `grep` and `cat`. Edit, Write, NotebookEdit, WebFetch and WebSearch are
  disallowed, no MCP server is loaded, and no session is saved.
- Only your user-level Claude Code settings load. The repository's own Claude Code settings, hooks and
  instruction files do not, so the file being checked never instructs the agent that checks it.
- No agent writes a file. The fixer returns its edits as data; proof applies them under its policy to
  the instruction file alone and records them in the sidecar next to it. With `--commit` it commits
  those two files and nothing else.
- A command an agent cites as evidence is re-run only when it is on proof's read-only list, with no
  redirection, substitution or chaining.

Verdicts are cached outside the repository, under `$XDG_CACHE_HOME` or `~/.cache/`. A repository's
content can still try to mislead the verifier. proof keeps a verdict only when its citations check out
and re-verifies every fix with a fresh agent, but on a repository you do not trust, read the diff
before you keep it.

## What it costs

`proof check` is free: it calls no model. `proof run` calls `claude -p` under your own Claude Code
login, so on a Claude subscription the calls count against its usage limits, and with an API key they
are billed to it. `--budget-usd` caps the whole run, $10 by default, in the cost `claude` reports for
each call. A stage the budget does not reach is skipped, its statements stay open, and the report says
so. The verifier and the fixer use `claude-sonnet-5-5` at high effort unless you pass `--model` or
`--effort`. Verdicts are cached, so a re-run pays only for what changed: on denoland/deno a full run
cost $2.37 and the re-run after its fixes $0.15.

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

## How well it works

<!-- generated:metrics -->
Corpus: 12 public repositories pinned to commits (6 tune, 6 held-out, never run while tuning), one instruction file each. Labels: independent agent labels with cited evidence, each relabeled blind by a second agent under `eval/LABELING.md`; the maintainer adjudicated every disagreement; 126 labels changed in that review, with the evidence in the label file.

| Stage, split | Repos | Labeled statements | STALE precision | STALE recall | VERIFIED precision | Fixes kept |
| --- | --- | --- | --- | --- | --- | --- |
| `proof check`, tune | 6 | 364 | 100% (4 flagged) | 25% (16 stale) | 100% (28) | — |
| `proof run`, tune | 6 | 364 | 100% (15 flagged) | 93.8% (16 stale) | 78% (246) | 100% (14) |
| `proof check`, held-out | 6 | 316 | 0% (6 flagged) | 0% (7 stale) | 94.1% (17) | — |
| `proof run`, held-out | 6 | 316 | 87.5% (8 flagged) | 100% (7 stale) | 75.9% (145) | 90.9% (11) |

Run time on denoland/deno (14,927 files, 137 open statements in CLAUDE.md): a full `proof run` took 10 minutes and $2.37 (9 statements fixed, 1 fix rejected); the re-run after the fixes took 55 seconds and $0.15. An independent review of that diff kept 9 of 9 fixes.
<!-- /generated:metrics -->

Scored by `node eval/score.mjs` against `eval/labels/`; `eval/` holds the corpus, the reports and
the labels, so every number can be re-derived. "Fixes kept" is one sample: the fixer words its fixes
differently on each run, and an independent reviewer judges the fixes of that run. VERIFIED
precision is held down by one error class: the verifier marks a guidance line VERIFIED when the
names in it exist ("use anyio, not asyncio"), and the labels call such lines judgment. 54 of the
246 tune and 35 of the 145 held-out VERIFIED lines are of this kind; the labeling protocol and the
review that settled it are in `eval/LABELING.md`.

The held-out rows are the frozen build's one run on repositories it had never seen. Its mechanical
stage failed there: all six of its stale flags were false, from MSBuild file types it did not know,
example project names read as real paths, CI bot commands (`/azp run`) read as programs, and `{name}`
templates. Those causes are fixed since, and `proof check` on the same repositories now flags nothing
false and verifies 21 statements, 19 of them labeled true; the other two, a heading fragment and a
placeholder command, are judgment (`eval/after-heldout.json`). The split has been seen now, so that
is no longer a held-out number.

## Where it works

What the checks read mechanically in each ecosystem, each cell proven by a fixture in
`test/matrix.test.ts`. The verifier agent covers the rest, and the corpus column counts the pinned
public repositories of the evaluation above.

<!-- proof:ignore-start reason="names the kinds of files proof reads in other repositories, not files of this one" -->
<!-- generated:matrix -->
| Ecosystem | Scripts and tasks | Versions | Definitions | Corpus repos |
| --- | --- | --- | --- | --- |
| Node | package.json scripts, workspaces, `npx`/`bunx` binaries | `engines`, `.nvmrc`, `.node-version`, `.tool-versions`, Dockerfile, CI | tree-sitter TypeScript, TSX, JavaScript | 3 |
| Python | pyproject scripts (`uv`/`poetry`/`pdm`/`hatch run`), tox, nox, `python -m`, `manage.py` | `requires-python`, `.python-version`, Dockerfile, CI | tree-sitter Python | 2 |
| Go | `go run`/`go test` on package paths | go.mod `go` and `toolchain` | tree-sitter Go, `pkg.Symbol`, receivers, struct tags | 3 |
| Rust | cargo commands, aliases, `-p` crates | `rust-toolchain`, `rust-version` | tree-sitter Rust | 1 |
| JVM | Gradle tasks (registered or standard), Maven phases | agent only | tree-sitter Java; Kotlin by line patterns | 1 |
| Ruby, PHP, .NET | rake tasks from the syntax tree, composer scripts, `dotnet` projects | Gemfile `ruby`; PHP and .NET agent only | tree-sitter Ruby, PHP, C# | 2 |
| Shell | functions and `case` labels in any script, justfile recipes, Taskfile tasks | — | tree-sitter Bash | — |
| Containers and CI | compose services, workflow job names | compose and Dockerfile image tags | YAML parse; Dockerfile stages agent only | — |
<!-- /generated:matrix -->
<!-- proof:ignore-end -->

## Reading the report

Every statement lands in one section. Every verified span names its evidence level: definition,
declaration or reference; a match in a comment or inside a longer string never verifies anything.

<!-- generated:statuses -->
| Section | Meaning | Your job |
| --- | --- | --- |
| Fixed | Edited, and a fresh verifier confirmed the new text. Review the diff. | show the user the diff (`git diff -- <file>`) |
| Fix rejected | The re-verifier refused these edits; they were reverted. | correct the line by hand from the reason, or ask |
| Stale | The repository contradicts these, and no fix was applied. | correct it from the reason, or ask |
| Unconfirmed | Part of each has no evidence; nothing contradicts it either. | relay it to the user as a decision |
| Unverified with reason | The reason says what evidence is still missing. | relay it to the user as a decision |
| Overrides | Silenced by a proof:ignore marker with a reason. | leave it unless the reason no longer holds |
| Decided | Settled by a recorded decision. | nothing |
| Verified | Proven at the level shown, or by the verifier with citations proof re-checked. | nothing |
| Not checked | Outside the repository: system files and external tools. | nothing |
<!-- /generated:statuses -->

The header gives the verdict of the file and the exit code:

<!-- generated:verdicts -->
| Verdict | Meaning | Exit |
| --- | --- | --- |
| `PROVEN` | every statement verified at definition or declaration level, or decided | 0 |
| `PROVEN WITH OVERRIDES` | as above, with at least one override or reference-level proof | 0 |
| `FIXED` | stale lines were found, and all were fixed and re-verified | 0 |
| `PARTLY PROVEN` | open items remain for a decision | 0 |
| `NOT PROVEN` | stale lines remain, or a fix was rejected | 1 |
| `UNTESTED` | unreadable, or the verifier did not answer every open statement | 2 |
<!-- /generated:verdicts -->

A check that cannot run fully, such as a manifest that does not parse, is named in a `degraded:`
header line and keeps its statements open. The report warns when your checkout is behind its
upstream. `proof check` writes nothing into your repository.

## Commands

<!-- generated:commands -->
| Command | What it does |
| --- | --- |
| `proof check` | Checks every statement of every instruction file an agent loads, and the files they `@import`, with deterministic parsers. Writes nothing. |
| `proof run` | Checks, hands what the checks leave open to a verifier agent whose citations proof re-checks, fixes the stale lines, and re-verifies each fix with a fresh agent. Can take many minutes. |
| `proof decide` | Lists a file's open statements, or records a person's decision on one in <file>.proof.json. |
| `proof revert` | Puts back the text a fix replaced and records the rejection, so it is not proposed again. |
| `proof install` | Copies this skill to ~/.claude/skills/claude-md/ and ~/.agents/skills/claude-md/, so every agent finds it. |
<!-- /generated:commands -->

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

Everything users get is generated from `src/` by `npm run build`: the bundle and its grammars, their
third-party notices, the skill (from `src/skill/SKILL.md.tmpl`) with a copy of `LICENSE`, the tables
in this README and the plugin manifest version.
CI runs `npm run build:check` and fails when any committed copy is out of date. `package.json`
holds the only version; `npm run release -- <version>` sets it, rebuilds, writes `CHANGELOG.md`
from the conventional commits, and tags. `docs/spec.md` is the design spec, with its acceptance
criteria and where each one stands.

## License

MIT, in `LICENSE`; every install of the skill carries a copy of it. The libraries bundled with proof
and the tree-sitter grammars shipped beside them keep their own licenses, all listed in
`plugins/proof/skills/claude-md/scripts/THIRD_PARTY_NOTICES.md`.
