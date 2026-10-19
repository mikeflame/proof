---
name: claude-md
description: >-
  Prove every statement in CLAUDE.md, AGENTS.md or another agent instruction
  file still matches the repository, with evidence for each, and fix the stale
  ones. Use when the user says "update CLAUDE.md", "is CLAUDE.md still
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
run `scripts/proof.mjs` from the folder this file is in.

## 1. Preconditions

Node 22+ and git. `proof run` also needs the `claude` CLI (or `PROOF_CLAUDE`
set to its path). Without it, run `proof check` and do the verification
yourself (section 6).

Read the report header first. A `degraded:` line names a check that could not
run fully (a manifest that does not parse, a failed lookup); the statements it
affects stay open, never passing. A warning that the checkout is behind its
upstream means you are reading an old copy: check the branch people work on.

## 2. Run the pipeline

```bash
proof run                       # every instruction file an agent loads here
proof run CLAUDE.md             # one file, and every file it @imports
proof run --dry-run             # show the fixes as a diff, write nothing
proof run --no-fix              # verify only
proof run --user                # also ~/.claude/CLAUDE.md and ~/.claude/rules/
```

It finds every file an agent loads (CLAUDE.md, CLAUDE.local.md, AGENTS.md,
`.claude/rules/`, Copilot, Cursor, Gemini, Windsurf, Cline and Aider files),
follows `@imports` four hops deep, checks every statement with real parsers,
hands what they leave open to a verifier agent that must cite evidence proof
re-checks, fixes the stale lines, and re-verifies each fix with a fresh agent.
A run can take many minutes; a long-running call is working, not stalled.
Nothing is committed unless you pass `--commit`.

## 3. Read the report in order

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

Verdicts, from the header:

| Verdict | Meaning | Exit |
| --- | --- | --- |
| `PROVEN` | every statement verified at definition or declaration level, or decided | 0 |
| `PROVEN WITH OVERRIDES` | as above, with at least one override or reference-level proof | 0 |
| `FIXED` | stale lines were found, and all were fixed and re-verified | 0 |
| `PARTLY PROVEN` | open items remain for a decision | 0 |
| `NOT PROVEN` | stale lines remain, or a fix was rejected | 1 |
| `UNTESTED` | unreadable, or the verifier did not answer every open statement | 2 |

Evidence levels: `definition`, `declaration`, `reference`. A match in a comment
or inside a longer string never verifies anything.

## 4. Relay what needs a person

For each open statement, show the user the statement, the reason and the
evidence, verbatim, and ask whether it is a rule to keep or a fact, and why.
The report prints every reason in full, and `proof decide <file>` lists the open
statements again with the verifier's reasons from the last run. Long statements
are shortened in both: quote them from the file at their line. Record the
answer:

```bash
proof decide CLAUDE.md                                        # list open items
proof decide CLAUDE.md L12 --rule --reason "team convention, no lint rule"
proof decide CLAUDE.md L14 --fact --evidence src/db/index.ts:3 --reason "the pool lives here"
```

Never decide a fact without evidence. Never record a decision the user did not
make. A decision is replayed on later runs and reopens when its line is edited.

To undo one fix: `proof revert CLAUDE.md --id <id shown on the fixed line>`.

## 5. Rules

- Never silence a stale line with an ignore marker. An override needs a reason,
  `<!-- proof:ignore reason="…" -->`, and shows up under Overrides.
- Correct only what is wrong. Do not add lines to close gaps unless the user
  asked for `--gaps`, which proposes and never writes.
- Never edit a managed policy file; edit user-level files only with `--user`.

## 6. Without the verifier

`proof check` runs the same checks without the agent stage. Verify each open
statement yourself: open the files it names, recount numbers and cite the
command, check rules against the tooling config (lint, formatter, CI), check
status words (active, legacy, deprecated) against `git log`. When in doubt, the
statement stays open with your reason. Never call it true without evidence.

## 7. Done

Done means the final verdict is `PROVEN`, `PROVEN WITH OVERRIDES` or `FIXED`,
or every open item was decided by the user, and the user has seen the diff.

An example report block (columns and wording may vary; the header is
authoritative):

```
# CLAUDE.md: FIXED

0 stale · 1 fixed · 0 unconfirmed · 0 unverified · 4 verified · 0 not checked

## Fixed (1)

- **L9** bash dev.sh down-light # stop everything
  - fixed (tier A, id a149fae716): was "bash dev.sh down # stop everything"
    - ✓ file_line `dev.sh:3` "down-light() { docker compose down; }"
```
