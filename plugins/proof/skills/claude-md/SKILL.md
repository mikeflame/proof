---
name: claude-md
description: >-
  Prove every statement in CLAUDE.md, AGENTS.md or another agent instruction
  file still matches the repository, with evidence for each, then propose the
  edits. Use when the user says "update CLAUDE.md", "is CLAUDE.md still
  accurate", "audit AGENTS.md", "revisit the instructions", after a major
  feature, refactor, folder move or dependency upgrade, or when a session
  started from wrong information in the file.
allowed-tools:
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/proof.mjs)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/proof.mjs *)
---

# Prove CLAUDE.md

The instruction file loads before every session. An outdated one is worse than
a short one: if the database layer moved but the file still points at the old
folder, every session starts from the wrong map before the task even begins.

`proof` below means `node ${CLAUDE_SKILL_DIR}/scripts/proof.mjs`. Other agents:
run `scripts/proof.mjs` from the folder this file is in. It needs Node 22+ and
git; everything else ships next to it.

## 1. Run the check

```bash
proof check              # every instruction file an agent loads in this repository
proof check CLAUDE.md    # one file, and every file it @imports
proof check --user       # also ~/.claude/CLAUDE.md, ~/.claude/rules/ and the managed policy file
```

It finds what each agent loads: `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`
(even when gitignored), `AGENTS.md`, `.claude/rules/`, Copilot, Cursor, Gemini,
Windsurf, Cline and Aider files, in any folder. It follows `@path` imports the way
Claude Code does (relative to the importing file, four hops deep, never inside
code), and an importer's verdict includes what it pulls in. The `loaded:` and
`imports:` header lines say why each file counts. A rule's `paths:` globs are
read as Claude Code reads them: a pattern that matches nothing is unconfirmed,
and a rule none of whose patterns match is stale because it never loads.

It splits the file into statements (list items, table rows, sentences, fenced
command lines, imports) and checks each name in them against the repository
with a real parser for each artifact: the file tree, `package.json` scripts,
Makefile and task-runner targets, shell functions and `case` labels, version
sources, manifests, and a syntax tree for identifiers. Every check cites
`file:line` and an evidence level.

Read the header first. A `degraded:` line names a check that could not run
fully (a manifest that does not parse, a language without a grammar); the
statements it affects are listed as unverified, never as passing.

| Status | Meaning | Your job |
| --- | --- | --- |
| Stale | the repository contradicts it | find what is true now and rewrite or delete the line |
| Unconfirmed | part of it has no evidence, and nothing contradicts it | search for it; a vanished name is stale, a match only in comments is not evidence |
| Unverified with reason | the names check out or nothing is mechanical, and the reason says what is left | verify what the reason names (step 2) |
| Overrides | silenced by a `proof:ignore` marker with a reason | leave it unless the reason no longer holds |
| Verified | every name checks out at the level shown, or the verifier proved it with citations | re-read it if it states status, counts or purpose (step 3) |
| Not checked | outside the repository: system files, external tools | leave it |

Evidence levels: `definition` (where the name is defined), `declaration` (a
config key, a column, a manifest entry), `reference` (a call site or an exact
string). A match in a comment or inside a longer string never verifies.

A statement that says something was removed ("the `x` block was deleted") is
checked as an absence and marked `[should be absent]`.

If the report says the checkout is behind its upstream, you are reading an old
copy of the file. Check the branch people work on before proposing anything.

## 2. Verify what the checker leaves open

```bash
proof run                # check, then a verifier agent on every open statement
proof run CLAUDE.md --budget-usd 5
```

`proof run` hands every statement the checks did not settle to a verifier agent
(the `claude` CLI, read-only tools, the file under test kept out of its context)
and keeps a verdict only when its citations check out: proof re-reads every
cited `file:line` and re-runs every cited command. A run can take many minutes;
a long call is working, not stalled. Each verdict shows as a `verifier:` line
with its evidence (✓ checked, ✗ refused and why) and, for stale lines, the
proposed text. The `verifier:` header line gives coverage and cost; a file whose
open statements were not all answered is UNTESTED, never passing. A verifier
that says true while the mechanical check says stale is a decision for the user.

When `proof run` is unavailable (no `claude` CLI, no budget), do this step
yourself. The reason on each unverified statement names what is left: a
description, a count, a status word, a rule. Sort each into one of two kinds:

- **Rule**: how to work ("Don't refactor things that aren't broken", "No inline
  styles"). Check it against the repo's own tooling (lint, formatter, type
  checker, CI, pre-commit). Keep it unless the tooling contradicts it; then cite
  the config file.
- **Fact**: a claim about the code ("e2e: Cypress tests", "40+ job types",
  "integrations: Stripe, Twilio…"). Prove it with a file and line, a dependency or
  a command's output. Recount every number and cite the command you used.

When in doubt, the statement stays unverified with your reason. Never call it
true without evidence.

## 3. Verified is not the same as current

The checker proves names exist, not that the words around them still hold.
Re-check verified lines that state status (active, deprecated, legacy), counts,
brands or ownership. `git log -1 --format='%h %ad %s' -- <path>` shows when a
path last changed; a folder called "active" that nobody touched in years is a
lead.

## 4. Report, then propose the edit

Report a table: line, statement, verdict (true, stale or unclear), evidence,
proposed text. Then show the diff. Correct only what is wrong: never add lines to
close gaps unless the user asked for that. The file is the user's instructions:
apply the diff only when asked or approved. Prefer deleting a dead line to
rewriting it into history.

Never silence a stale line with an ignore marker. An override needs a reason,
`<!-- proof:ignore reason="…" -->`, and shows up under Overrides.

Afterwards run the check again; done means 0 stale and every remaining open item
kept on purpose, with its reason.
