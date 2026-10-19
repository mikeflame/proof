# proof rework: from checker to verification pipeline

Status: implemented through phase 7, 2026-10-01; section 13 gives the standing of each criterion. Owner: Mykhailo Savonik.
Reference implementation studied: [kunchenguid/no-mistakes](https://github.com/kunchenguid/no-mistakes) at `f4b85ae` (release 1.85.3).

This document replaces the first review of the repo. It is the working spec for the next version of `/proof:claude-md`. Every section ends in acceptance criteria that fail against the current code, so a session can pick one up and know when it is done.

---

## 0. Decisions this spec is built on

| ID | Decision | Source |
| --- | --- | --- |
| D1 | **Quality and universality over speed.** A run may take 10 to 20 minutes. The tool must work on any language, toolchain and repo shape. The single small zero-dependency script is no longer a design constraint; dependencies and heavier tooling are allowed whenever they buy correctness. | Mike, 2026-10-01 |
| D2 | **Autofix is the product.** The tool fixes the instruction file by default. The human reviews the resulting diff, not each edit before it happens. | Mike, 2026-10-01 |
| D3 | **Evidence over confidence.** Every verdict and every fix cites inspectable evidence. An uncertain check reports unconfirmed, never stale and never verified. Agent confidence is not evidence. | kept from the current design; also no-mistakes VISION.md |
| D4 | **Fail closed, degrade loudly.** A check that cannot run says so in the report. Nothing is dropped silently. An unclassifiable item defaults to the stricter class. | no-mistakes `ActionOrDefault`, VISION.md |
| D5 | **Human decisions are facts.** A decision recorded once is replayed on every later run and never re-asked unless the statement it covers changed. | no-mistakes settled questions |

Derived from D1 and D2, the following are **no longer goals**: sub-second runs, a 30 KB bundle, "needs only Node and git", a report the agent reads in one screen. Derived non-goals that stay: the tool is not a documentation generator, not a prose linter, and not a gap finder by default (see section 5.4).

---

## 1. Where the current tool stands

### 1.1 Runs performed for this spec

| Target | Wall | Stale | Of which true | Verified | Needs judgment | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A large private TypeScript monorepo (first tuning target) | 3.7 s | 2 | 2 | 69 | 43 | 71 git processes, 41 of them `check-ignore` |
| no-mistakes `AGENTS.md` (Go) | 2.5 s | 1 | **0** | 46 | 12 | the one stale line is a Go qualified name read as a path |
| no-mistakes `CLAUDE.md` (`@AGENTS.md` only) | n/a | 0 | n/a | 0 | 1 | the import is not followed; nothing checked |
| Synthetic edge repo (see 1.3) | n/a | 4 | 3 | 5 | 4 | one crash on a malformed nested package.json |

Evidence quality on the no-mistakes run:

| Verified spans | 281 |
| --- | --- |
| cited from a comment line | 104 |
| cited from a definition | 17 |

So "verified" today mostly means "some line mentions it", and the only red line on a serious non-JS repo is a false alarm. By the project's own stated priority, that false alarm is the worst defect in this list.

### 1.2 Defects, ranked

1. **False stale.** `pkg.Symbol` style names (`internal/testgit.RealGit`) are classified as paths and reported missing.
2. **Verified on weak evidence.** `MODE=queue` verified because a file mentions `MODE` and contains the substring "queue" anywhere. `req.sessionId` verified by `x.sessionId` through the last-segment fallback. Identifiers verified by comment lines. A link `../outside.md` verified by escaping the repo root.
3. **Silent drops.** `cd api && yarn start` yields no span. `./scripts/run.sh deploy` loses its command span because the runner regex has no slash. `python`, `pip`, `npx`, `cargo`, `go`, `docker compose`, `just`, `task` are not runners. Negated mentions ("the `waiting_on` block was deleted") are read as claims.
4. **Imports and discovery.** `@path` imports are not parsed. Only root-pattern `CLAUDE.md` and `AGENTS.md` are discovered.
5. **Crash on data.** One malformed package.json within two levels aborts the run with exit 2 and no report.
6. **Own-rule violations.** `make build` reported stale with "no Makefile" when the Makefile is in a subfolder. `bin/` is git-ignored but reported as an unknown folder because directory-only ignore patterns are not honored for absent directories.
7. **No memory.** The 43 judgment items on the monorepo come back on every run. Ignore markers remove statements with no reason and no trace.
8. **Hand-synced surfaces.** SKILL.md, the README table and the CLI help describe the same vocabulary by hand. Version lives in three files. The bundle must be rebuilt and committed by hand. No CI runs any of it.
9. **Repo hygiene.** Private repo with a public install path in the README. parse/check/git are byte-identical copies of the sibling repo. Receipt machinery in git.ts serves a feature this product lacks. Fixtures mirror the tuning monorepo despite the AGENTS.md rule against it.

### 1.3 Synthetic edge repo used for probing

Layout: root `package.json` with `engines.node ">=26"`, `api/` with a malformed package.json, `api/index.ts` containing `MODE`, the string "the queue of things" and `x.sessionId`, `tools/dev.sh` using `case` labels, `scripts/run.sh` with `function deploy`, `web/Makefile`, `.claude/rules/style.md`, `CLAUDE.local.md`, and an `outside.md` one level above the repo. Instruction file: `@README.md`, `@docs/missing.md`, the commands and names above, `Node 24+`, a dynamic-route path with literal brackets, and links to `../outside.md` and `.claude/rules/style.md`. Keep this as the first fixture of section 9.6.

---

## 2. What no-mistakes teaches

Mechanisms observed in the source, with the principle each one carries.

| Principle | Where it lives in no-mistakes | What it means for proof |
| --- | --- | --- |
| Fail closed | `internal/types/findings.go` `ActionOrDefault` turns an empty action into `ask-user`; review prompt: "When in doubt, default to ask-user"; "A file you omit is treated as unreviewed by the pipeline, never as clean" | every span yields a result; unclassifiable → the stricter class; statements the agent does not cover are unverified |
| Evidence bound to a head | `TestedHeadSHA` must equal the run head for `live_validation` to be attested; verification plan is digest-checked on every read | decisions and fixes record tree hash and head; the report says when a decision predates the current text |
| Overrides are never a clean pass | `passed-with-override` outcome with `override_reason`; skill: "Report the exception, not a clean pass" | ignore markers require a reason and are listed under Overrides; a distinct verdict |
| Honest "untested" | test prompt: "Never guess a pass… an honest 'untested' after exhausting your workarounds costs nothing and a guessed 'pass' costs everything" | the agent's structured output has `unverified_with_reason`; no silent pass |
| Separate roles, re-verified fixes | reviewer and fixer have separate memory; "a reviewer never certifies its own prescription"; each step's edits are judged at its own gate | verify → fix → fresh re-verify, with the fixer never certifying its own edit |
| Pipeline runs forward | VISION.md: each step runs once in fixed order; a step iterates only inside its own bounded fix budget | one bounded fix round, then a final verification; no open loops |
| Human decisions persist | settled questions stored per branch and rendered as "do not re-raise"; "A decision a human makes at any gate is a fact of the run from then on" | the decisions sidecar of section 4.5 |
| Correct, never pad | document prompt: memory files are edited "only to correct or remove information that is factually wrong; never add content because something is missing"; audit found doc commits in 90 of 121 PRs from sweep language | the gap hunt is removed from the default flow |
| One owner per fact | document prompt: "Every fact or contract has exactly one authoritative owner document… never synchronize prose copies"; `.no-mistakes.yaml` carries an ownership map | a repo config with an ownership map; stale copies become pointers (section 5.3) |
| Generated agent surfaces with drift check | `cmd/genskill --check`; `axi_guidance_test.go` pins the same sentences across skill, docs and CLI | SKILL.md, README tables and CLI help rendered from one source, drift-checked in CI |
| Test the behavior, not the text | `testguidance.Rule`: a substring or regex over a file "is still the anti-pattern" | the same rule governs the runtime verifier: a comment mention is not a definition |
| Measured quality | gold labels from real human decisions; pinned held-out set never tuned on; headline F1 withheld without false-positive gold | the eval corpus of section 9.6 |
| Install for every agent | `internal/skill/install.go` writes `~/.claude/skills/...` and `~/.agents/skills/...` | the `install` command of section 9.4 |
| Written scope with a refusal list | VISION.md "Changes should be resisted when…" | a one-page VISION.md for proof |

Where the etalon itself drifted is also instructive, see section 12.

---

## 3. Target architecture

A forward pipeline. Each stage writes its result to a run directory; the next stage reads it. A run is resumable by tree hash.

```
discover → parse → mechanical verify → agent verify → fix → re-verify → record → report
```

Budget: the whole run on a 10k-file monorepo finishes inside 20 minutes. Mechanical results are cached by tree hash so a re-run after fixes pays only for changed statements.

### 3.1 Discover

Find every instruction file an agent would load, following the Claude Code memory rules and the common files of other agents.

Project level: `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/AGENTS.md`, `.claude/rules/*.md`. Per-folder copies of the same names anywhere in the tree. Other agents: `.github/copilot-instructions.md`, `GEMINI.md`, `.cursor/rules/*.mdc`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `CONVENTIONS.md`. User level with `--user`: `~/.claude/CLAUDE.md`, `~/.claude/rules/*.md`. Managed policy paths are listed, never edited.

Imports: `@path` outside code spans and fences, relative to the importing file, absolute and `~` paths, followed recursively up to the hop limit in the memory doc. Each imported file becomes a target. A broken import is a stale statement of the importer.

Rule files with `paths:` frontmatter: the globs are claims; a glob matching no file is stale.

### 3.2 Parse

Markdown is read through a real parser (an mdast-compatible library, bundled), never regexes. Statements are list items, table rows, sentences, fenced command lines and import lines. Sentences come from the platform segmenter so abbreviations do not split. HTML comments are recognized as proof markers or ignored.

Shell fences and inline commands are tokenized by a shell-aware splitter: `&&`, `||`, `|`, `;`, subshells, quotes, env prefixes, `cd x &&` resolution of the working folder. Every simple command becomes a span.

Classification never discards: a span the classifier cannot type becomes `unknown` and is still reported.

Negation and mention detection: a statement that says a thing was removed, deleted, retired or renamed is a mention of the old name, not a claim; it is checked as "should be absent" and reported accordingly. Quoted versions and code in quotation marks stay mentions.

### 3.3 Mechanical verify

Deterministic, as slow as it needs to be. Verification uses the real consumer or a real parser of each artifact, never a substring:

- Paths and globs: the file tree, from the repo root, the file's folder, each package folder, and the folder a preceding `cd` selected. Literal `[slug]` segments stay literal before any placeholder expansion.
- Links: resolved relative to the document, confined to the repo root.
- Scripts: `package.json` scripts parsed as JSON; `Makefile` targets parsed from every Makefile under the chosen folders; `justfile`, `Taskfile.yml`, `tox.ini`, `noxfile.py`, `pyproject` scripts, `Cargo.toml` aliases, `composer.json`, `Gemfile`/`Rakefile` tasks, Gradle and Maven task names where cheap.
- Shell subcommands: functions and `case` labels extracted with a shell grammar (tree-sitter bash), not line regexes.
- Versions: the source of truth per ecosystem (`engines`, `.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`, `.python-version`, `pyproject` `requires-python`, `go.mod` `go`, `rust-toolchain`, `Gemfile` `ruby`, `Dockerfile` `FROM`, compose images, CI matrices). The claim's qualifier (`24`, `24+`, `>=24`) is compared against the strictest floor.
- Identifiers: definitions first, through a symbol index (tree-sitter grammars or universal-ctags when present) across the languages in the repo; references second, through `git grep` with word boundaries; comments last. The evidence ladder of section 4.2 records which level matched.
- Environment variables: a definition is a read of that variable in code or a declaration in an env example, compose or CI file; the claimed value must appear in the same declaration or the same assignment, never anywhere in the same file.
- Dependencies named in prose: capitalized product names resolve through an alias table to package names across ecosystems and are looked up in manifests and lockfiles.

Degradation is explicit: a package manifest that fails to parse, a missing git, an unsupported ecosystem, each becomes a `degraded:` header line and the affected spans report `not checked` with the reason.

### 3.4 Agent verify

This is where the budget goes. Every statement not settled at definition level by stage 3 is handed to a verifier agent with a per-statement budget and a structured-output schema (section 4.4). The verifier must open files, run read-only commands, recount, and cite. Its rules, rendered from the same source as the skill:

- A verdict without `evidence[]` is invalid output and the statement stays unverified.
- Statements the verifier does not return are unverified, never clean. The run reports its coverage.
- Rules are checked against tooling config (lint, formatter, type-checker, CI, pre-commit), never against taste. A rule that the tooling contradicts is a finding with the config file cited.
- Counts are recounted and the command used is the evidence.
- Status words (active, legacy, deprecated, canonical, preferred) are checked against `git log` recency and against where new code lands.
- Negated mentions are checked for absence.
- When in doubt the verdict is `unverified_with_reason`, never `true`.

### 3.5 Fix

The fixer agent receives only: the statement, its verdict, its evidence, the autofix policy (section 5), the repo ownership map, and the decisions sidecar. It never receives the verifier's reasoning beyond the evidence. It produces an edit per statement with a tier and the evidence it relied on. Edits are applied to the working tree. Nothing is committed unless `--commit` is passed.

### 3.6 Re-verify

A fresh verifier context, no fixer memory, checks every edited statement and every statement whose evidence pointed at a file the fixer touched. An edit whose re-verification fails is reverted and reported as `fix-rejected` with both verdicts. There is exactly one fix round by default; `--fix-rounds N` bounds more.

### 3.7 Record

Every decision, fix, override and rejected fix is appended to the decisions sidecar with the tree hash and head at the time. The tree hash finally has a job.

### 3.8 Report

Markdown for humans and agents, JSON for machines, `next:` lines with exact commands. See section 7.

---

## 4. Statement model

### 4.1 Statuses per statement

`VERIFIED`, `STALE`, `UNCONFIRMED`, `UNVERIFIED_WITH_REASON`, `DECIDED`, `OVERRIDDEN`, `NOT_CHECKED`, `FIXED`, `FIX_REJECTED`.

### 4.2 Evidence ladder per span

| Level | Example | May produce VERIFIED |
| --- | --- | --- |
| `definition` | `func RealGit`, `scripts.dev` in package.json, `function up()` in a shell AST, a directory entry | yes |
| `declaration` | `MODE=queue` in compose or an env example, `engines.node` | yes |
| `reference` | an import or a call site found by word-bounded grep | yes, marked `reference` |
| `comment` | the name inside a comment or docstring | no, reports unconfirmed with the match shown |
| `substring` | the text inside a longer token or a string literal | no |
| `none` | | no |

### 4.3 Actions per finding

`auto-fix`, `fix-with-evidence`, `pointer`, `needs-decision`, `no-op`. The default for anything unclassified is `needs-decision`.

### 4.4 Structured output schema for the verifier

```json
{
  "statement_id": "sha1 of normalized text",
  "verdict": "true | stale | unverified_with_reason",
  "evidence": [{ "kind": "file_line | command_output | count | git_log", "ref": "path:line or command", "excerpt": "≤200 chars" }],
  "reason": "required when unverified_with_reason",
  "proposed_text": "optional, required when stale",
  "action": "auto-fix | fix-with-evidence | pointer | needs-decision | no-op"
}
```

An object missing `evidence` for a `true` or `stale` verdict is rejected and the statement remains unverified. `confidence` is not a field.

### 4.5 Decisions sidecar

One committed file per instruction file, for example `CLAUDE.md.proof.json`, holding an array of records:

```json
{
  "statement_id": "…", "text": "the statement as decided",
  "kind": "rule | fact | fixed | override | fix-rejected",
  "reason": "free text, required for override",
  "evidence": [ … ], "by": "name or agent", "at": "ISO date",
  "tree": "working tree hash", "head": "commit"
}
```

Replay rules: a record whose `text` still matches is honored and shown as `DECIDED` with age in commits. A record whose statement text changed is reported as reopened. Inline `<!-- proof:ignore reason="…" -->` markers are read as `override` records; a marker without a reason is itself a finding.

### 4.6 Verdict ladder for a file

| Verdict | Meaning | Exit |
| --- | --- | --- |
| `PROVEN` | every statement verified at definition or declaration level, or decided | 0 |
| `PROVEN WITH OVERRIDES` | as above, but at least one override or reference-level verification | 0 |
| `FIXED` | stale items were found and all were fixed and re-verified | 0 |
| `PARTLY PROVEN` | open `needs-decision` or unverified items remain | 0 |
| `NOT PROVEN` | stale items remain after the fix round, or a fix was rejected | 1 |
| `UNTESTED` | file unreadable, or coverage below 100 percent because the agent stage failed | 2 |

Exit codes stay machine-friendly; the verdict text carries the nuance.

---

## 5. Autofix policy

Autofix is on by default (D2). `--dry-run` prints the diff without applying; `--no-fix` runs verification only.

### 5.1 Tier A: mechanical, always applied

A stale path, link, import, script name, subcommand or version where the repository offers exactly one candidate. Evidence: the candidate at definition level. Examples: a folder that moved, a script renamed, `Node 24+` when every floor says 26.

### 5.2 Tier B: rewrite with evidence

A fact whose current truth the verifier established at definition or declaration level: counts, status words, lists of integrations, descriptions of what a folder holds. The fixer rewrites the sentence to the evidence and keeps the author's phrasing where it still holds. Example: a folder described as the active component library that no longer exists, while the one described as deprecated is where every recent commit lands.

### 5.3 Tier C: pointer instead of copy

A fact that is a copy of something the repository already owns, such as a command list copied from a Makefile or package.json. Following the one-owner principle, the copy is replaced by a pointer to the owner. The ownership map in the repo config (section 9.1) names the owners; without a map, the fixer may only point to the file the evidence came from.

### 5.4 What autofix does not do

- It never adds content to close a gap. Gap hunting is available behind `--gaps` and produces proposals, not edits.
- It never deletes a rule. A rule contradicted by tooling is rewritten to match the tooling, with the config cited, and recorded as `fixed`.
- It never deletes a fact that is merely unverified. Such a fact stays and is listed under `needs-decision` with the reason. Deletion requires evidence of absence, for example a negated mention check or a removed definition found in `git log -S`.
- It never edits a managed policy file or a user-level file unless `--user` was passed.

### 5.5 Review after the fact

The run ends with the diff, one line per edit naming its tier and evidence, and the `next:` commands to revert any edit by statement id. Because every edit is in the sidecar with its evidence, a later `proof blame <statement>` answers why a line reads the way it does.

---

## 6. Universality matrix

The mechanical stage grows along this matrix; the agent stage covers whatever the matrix does not yet, and reports which cells were agent-only so the eval corpus can prioritize.

| Ecosystem | Scripts and tasks | Versions | Definitions |
| --- | --- | --- | --- |
| Node | package.json scripts, workspaces, `npx`/`bunx` | engines, .nvmrc, .node-version, Dockerfile | tree-sitter ts/tsx/js |
| Python | pyproject scripts, tox, nox, `manage.py`, `python -m` | requires-python, .python-version, Dockerfile | tree-sitter python |
| Go | `go run ./cmd/x`, `go test ./...` patterns | go.mod `go` | tree-sitter go, `pkg.Symbol` resolution |
| Rust | cargo aliases and commands | rust-toolchain | tree-sitter rust |
| JVM | gradle tasks, maven goals | toolchain blocks | tree-sitter java/kotlin |
| Ruby, PHP, .NET | rake, composer scripts, dotnet commands | Gemfile ruby, composer platform, global.json | tree-sitter where available |
| Shell | functions and case labels in any `*.sh`, `justfile`, `Taskfile.yml` | | tree-sitter bash |
| Containers and CI | compose services and images, Dockerfile stages, workflow job and step names | image tags | YAML parse |

Acceptance for a cell: a fixture repo for that ecosystem in the corpus, with gold labels.

---

## 7. Output protocol

### 7.1 Markdown report

Order: header with verdict, counts, degraded lines, branch and tree; then `Fixed`, `Fix rejected`, `Stale`, `Needs decision`, `Unverified with reason`, `Overrides`, `Decided` as a count with `--verbose` expansion, `Verified` as a count with `--verbose` expansion, `Not checked`. Each item: line, statement, span results with evidence level and reference. The report ends with `next:` lines, for example:

```
next:
  Review the diff: git diff -- CLAUDE.md
  Decide 3 open items: proof decide CLAUDE.md
  Revert one fix: proof revert CLAUDE.md --id <statement_id>
  Re-run: proof check CLAUDE.md
```

### 7.2 JSON

The report object of today, extended with `coverage`, `degraded[]`, `fixes[]`, `decisions[]`, `evidence_levels` counts, and `run{started, finished, budget_used}`. Always an array, one object per file.

### 7.3 Errors

Every error names the exact command that fixes it, in the style of no-mistakes `help` lines.

---

## 8. Skill spec

The skill is generated from the same source as the CLI help and the status vocabulary. Its job is to drive the pipeline and to relay what needs a human. Contents:

1. Preconditions and how to read `degraded:`.
2. Run the pipeline: `proof run [files] [--user] [--dry-run] [--no-fix] [--gaps]`. A run can take many minutes; a long-running call is working, not stalled.
3. Read the report in order: fixes, rejected fixes, stale, needs-decision.
4. For `needs-decision` items, relay each verbatim with its evidence and ask the user; translate the answer into `proof decide` with a reason. Never decide a fact without evidence; never record a decision the user did not make.
5. Never silence a stale line with an ignore marker. An override needs a reason and shows up as an override.
6. Correct only what is wrong. Do not add content to close gaps unless the user asked for `--gaps`.
7. Done means: the final verdict is `PROVEN`, `PROVEN WITH OVERRIDES` or `FIXED`, and the user has seen the diff.
8. An example report block, with the note that columns may vary and the header is authoritative.

Acceptance: a drift test fails when the skill, the README tables and the CLI help disagree on a single status or command name.

---

## 9. Engineering

### 9.1 Repo config

`.proof.yaml` at the repo root, read from the checked-out tree: `instruction_files` additions, `ownership` map of fact kinds to owner files, `autofix` tier switches, `budget_minutes`, `ecosystems` overrides. Absent config means defaults; config can tighten, never loosen D3 and D4.

### 9.2 CI

One workflow: build, bundle drift, skill drift, typecheck, unit tests, fixture suite, plugin validation, dogfood run on the repo's own `AGENTS.md` and `README.md` that fails on stale, and a read-only smoke run on three pinned public repos across ecosystems. A stale committed bundle or skill turns CI red.

### 9.3 Release

Conventional commits, generated changelog, one version source injected at build into the plugin manifest and the CLI.

### 9.4 Install

`proof install` writes the skill to `~/.claude/skills/claude-md/` and `~/.agents/skills/claude-md/`, idempotently, following the no-mistakes install layout so Codex, OpenCode and Pi find it. The marketplace path stays for Claude Code. The repository is made public before the README promises an install.

### 9.5 Shared core

parse, check and git move into one package consumed by this repo and by the sibling repo, or the sibling imports this build. Receipt comments either leave or become the sidecar of section 4.5.

### 9.6 Eval corpus

A corpus of public `CLAUDE.md` and `AGENTS.md` files pinned to commits, across the ecosystems of section 6, labeled by hand at statement level: stale, true, judgment, with evidence. A pinned held-out set is never tuned on. Metrics reported in the README with the corpus size:

- precision and recall of `STALE`
- precision of `VERIFIED` (a human agrees the evidence proves the statement)
- fix acceptance rate (fixes kept after human review of the diff)

With `--record-decisions`, accepted and reverted fixes on the user's own runs become local gold, opt-in, stored under the user's home.

### 9.7 Vision file

A one-page `VISION.md`: what proof is, what it is not, and which changes to resist. It carries D1 to D5 and the non-goals of section 0.

---

## 10. Acceptance criteria, consolidated

Each criterion is a test or a scripted check that fails today.

1. On no-mistakes `AGENTS.md`, `internal/testgit.RealGit` verifies against `func RealGit`; stale count is 0.
2. On no-mistakes `CLAUDE.md`, the `@AGENTS.md` import is followed and the AGENTS.md statements appear in the report.
3. On the synthetic edge repo: no exit 2; `degraded:` names the bad package.json; every statement has at least one result; `cd api && yarn start` is checked as `yarn start` in `api/`; `./scripts/run.sh deploy` verifies against the function; `make build` is unconfirmed, not stale; `../outside.md` is skipped as outside the repository; `./bin/no-mistakes` is skipped as ignored output; `MODE=queue` and `req.sessionId` are not verified.
4. A negated mention is reported as an absence check, not a claim.
5. Comment-level matches never produce `VERIFIED`; the no-mistakes verified count drops and each remaining item names its evidence level.
6. A second run after fixes on the tuning monorepo reports zero fixes, zero stale, and zero open judgment items; editing one decided line reopens exactly that line.
7. An ignore marker without a reason is a finding; one with a reason appears under Overrides and the verdict is `PROVEN WITH OVERRIDES`.
8. A fix the re-verifier rejects is reverted in the working tree and reported as `FIX_REJECTED`.
9. `--gaps` absent: no run adds a line to any instruction file.
10. Drift tests fail when the skill, README tables or CLI help disagree.
11. CI is red when the committed bundle or skill is stale; a fresh machine installs and runs in two commands.
12. The README reports the three corpus metrics with the corpus size.
13. A full run on a 10k-file monorepo finishes inside 20 minutes; a re-run after fixes finishes inside 5.

---

## 11. Work plan

Phases run forward. Each phase ends with its acceptance criteria green and the bundle, skill and docs regenerated.

1. **Correctness of the mechanical layer.** Defects 1, 2, 3, 5, 6 of section 1.2. Real markdown parser, shell splitter, evidence ladder, qualified names, degradation header. Criteria 1, 3, 4, 5.
2. **Discovery and imports.** Section 3.1. Criterion 2.
3. **Agent verification stage with structured output.** Sections 3.4 and 4.4. Coverage reporting. Budget handling.
4. **Autofix, re-verify, decisions sidecar.** Sections 3.5 to 3.7, 4.5, 5. Criteria 6, 7, 8, 9.
5. **Generated surfaces, CI, release, install, public repo.** Sections 8, 9.2 to 9.4. Criteria 10, 11.
6. **Universality and the eval corpus.** Sections 6 and 9.6. Criteria 12, 13.
7. **Shared core and VISION.md.** Sections 9.5 and 9.7.

---

## 12. What not to copy, and where the etalon itself drifted

- **Do not copy the surface area.** no-mistakes is a daemon, a TUI, a git proxy and a 397-line skill. proof is one pipeline with one skill. Copy the protocol discipline, the fail-closed defaults, the recorded decisions and the eval loop.
- **Do not copy its autofix default.** no-mistakes parks review findings for a human by default. proof fixes by default (D2). What carries over is that every fix is evidence-backed, recorded, re-verified by a fresh context, and reviewable afterwards.
- **The etalon drifted where it relied on prose.** Three of its documents say `make lint` fails CI on skill drift, but its CI workflow runs only gofmt and go vet. Its pipeline-steps page still says the document step "finds every documentation gap", which its own prompt forbids. Its test-quality rule bans substring checks, and several of its workflow tests use them. Generation plus drift tests held; hand-written sentences did not. That is the strongest argument for proof to exist, and for proof to apply the same generation and drift tests to itself.

---

## 13. Status, 2026-10-01

All seven phases are built. Each criterion of section 10 is listed with its proof and its standing. "Green" means a test or scripted check in the repository fails if the criterion breaks.

| # | Standing | Where it is proven |
| --- | --- | --- |
| 1 | Green | `test/acceptance.test.ts`, "criteria 1 and 5", against no-mistakes at the pinned commit (CI clones it) |
| 2 | Green | `test/discovery.test.ts` (imports, 4 hops) and `test/acceptance.test.ts` (no-mistakes `CLAUDE.md` → `AGENTS.md`) |
| 3 | Green | `test/acceptance.test.ts`, "criterion 3 and 4", on the synthetic edge repository built by `test/fixtures/edge.ts` |
| 4 | Green | `test/acceptance.test.ts`, "checks a negated mention as an absence" |
| 5 | Green | `test/acceptance.test.ts`, "criteria 1 and 5"; every result carries its evidence level |
| 6 | Green on a fixture; met on the tuning monorepo except 5 lines its owner postponed | `test/fix.test.ts`, "a second run after fixes and decisions…". On the tuning monorepo (private, not in this repository): the first pass fixed 1 statement and left 6 stale conventions, 1 rejected fix and 58 judgment lines; the owner decided 54 as rules, kept 7 conventions with an override and a reason, applied the rejected fix by hand, and postponed the 5 lines of one section. The next run made 0 fixes, found 0 stale and reopened 0, in 9 seconds from the cache; editing one decided statement reopened exactly it, and its neighbour on the same line stayed decided |
| 7 | Green | `test/pipeline.test.ts`, "reports a marker without a reason and honors one with a reason" |
| 8 | Green | `test/fix.test.ts`, "reverts a fix the re-verifier rejects" |
| 9 | Green | `test/fix.test.ts`, "never adds lines without --gaps", and `vetEdit` in `src/agent/fix.ts` refuses any edit that adds a line |
| 10 | Green | `test/surfaces.test.ts`, "one vocabulary": `node scripts/build.mjs --check` plus table, command and option agreement |
| 11 | Green | CI runs `build:check` (red on a probe branch with a stale bundle); `test/surfaces.test.ts`, "install", runs the installed copy |
| 12 | Green | README metrics block, generated from `eval/metrics.json` by `scripts/build.mjs` and drift-tested with it |
| 13 | Green | `eval/perf.json`: deno (14,927 files), full run 598 s, re-run 55 s |

### Evaluation

Labels come from agents independent of proof, each with cited evidence. On 2026-10-19 every statement was relabeled blind by a second agent and the maintainer adjudicated the 128 disagreements with both sides' evidence (`eval/LABELING.md`): 124 instruction lines whose names exist moved from true to judgment under the directive rule, the four disputed stale lines stayed stale, and no missed stale line was found. Numbers are from `eval/metrics.json`.

| Stage, split | STALE precision | STALE recall | VERIFIED precision | Fixes kept | Cost, uncached |
| --- | --- | --- | --- | --- | --- |
| `proof check`, tune | 100% (4 flagged) | 25% (16 stale) | 100% (28) | — | $0 |
| `proof run`, tune | 100% (15) | 93.8% | 78% (246) | 14 of 14 | $11.95 |
| `proof check`, held-out | 0% (6 flagged) | 0% (7 stale) | 94.1% (17) | — | $0 |
| `proof run`, held-out | 87.5% (8) | 100% | 75.9% (145) | 10 of 11 | $7.93 |

Tuning froze at `2e38c1b`; the held-out split ran once on that build. Its mechanical stage broke D3 on unseen ground: six stale flags, all false, from four causes (MSBuild file types, example project names read as paths, CI bot commands read as programs, `{name}` templates). The fixes for them came after (`6aab6ef`), and `eval/after-heldout.json` records the result: on the held-out repositories `proof check` flags nothing false and verifies 21 statements, 19 of them labeled true (the other two, a heading fragment and a placeholder command, are judgment since the label review); the tune split is unchanged. Those are no longer held-out numbers, and are not reported as such.

After the freeze the verifier prompt stayed at v4. A v5/v6 rule that kept conventions open was tried on the tuning monorepo and reverted, because it also kept false facts open ("is observability only and never changes gate resolution") and lost two gold stale lines on the tune split. The fixer gained four guards instead: it never rewrites a convention into a description of the code that breaks it, a fix it wraps onto more lines is joined back onto the lines it replaces, an edit stays inside its own statement, and the empty-subject guard reads the statement's whole line. The verifier's answers gained one guard too: a true verdict whose own reason says the claim is not shown stays open (it caught a hook the verifier saw but could not show was loaded; no corpus verdict matches it, so the numbers above are unchanged). The tune rows are measured at `6904b11`, with the verifier's verdicts reused from the cache (same prompt, same code). Fixes kept is one sample: the fixer words its fixes differently on each run, and the sample before the last fixer change kept 14 of 16.

### Known limits

- Mechanical recall is low by design: `proof check` flags 25% of the tune split's stale statements and the agent stage carries the rest. The check stage's job is to never be wrong (100% precision on the tune split), not to be complete.
- The verifier is not deterministic: two runs of the same file can disagree on a statement at the margin. Decisions (D5) and the verdict cache are what make a second run stable.
- The verifier calls guidance lines VERIFIED when the names in them exist ("Use `logger.Fatal` for core invariant violations"): nothing in the repository contradicts them, but nothing proves them either, and under the labeling protocol they are judgment. This is the verifier's largest error: 54 of the 246 tune and 35 of the 145 held-out VERIFIED lines are of this kind, which is what moved VERIFIED precision from 97.2% and 93.8% before the label review of 2026-10-19 to 78% and 75.9% after it. The correction belongs in the verifier (a directive stays open for a decision), not in the labels.
- The fixer checks that a new path exists, not whether the code there is deprecated. The one rejected held-out fix pointed a stale `/components` entry at a package whose own doc comment marks it deprecated.
- A correct fix to a fact inside a convention the code breaks is rejected: the re-verifier still finds the convention false, and nothing in the edit verifies mechanically. The person sees the proposed text under rejected fixes and can apply it.
- The fix stage varies between runs in wording and, at the margin, in whether a statement gets a fix at all. A second run picks up what the first left; rejected fixes are never proposed again.
- A new ecosystem can still surprise the mechanical stage, as .NET did. The held-out failure is the evidence, and the reason the check stage defers to the verifier whenever a lookup is uncertain.
