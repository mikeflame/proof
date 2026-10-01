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
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/claims.mjs)
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/claims.mjs *)
---

# Prove CLAUDE.md

The instruction file loads before every session. An outdated one is worse than
a short one: if the database layer moved but the file still points at the old
folder, every session starts from the wrong map before the task even begins.

## 1. Run the check

```bash
node ${CLAUDE_SKILL_DIR}/scripts/claims.mjs              # every CLAUDE.md and AGENTS.md in the repo
node ${CLAUDE_SKILL_DIR}/scripts/claims.mjs CLAUDE.md    # one file
```

(Other agents: run `scripts/claims.mjs` from the folder this file is in. It needs
Node 22+ and git, and has no dependencies.)

It splits the file into statements (list items, table rows, sentences, command
lines) and checks what a machine can check: paths and globs exist, `yarn` / `npm`
scripts and shell-script subcommands are defined, version claims match
`package.json`, `engines` and Docker images, and named identifiers and env vars
appear in code. It prints a markdown report, and each check cites `file:line`.

| Status | Meaning | Your job |
| --- | --- | --- |
| Stale | the repository contradicts it | find what is true now and rewrite or delete the line |
| Unconfirmed | part of it has no evidence in code | search for it; a vanished identifier is stale, a style term is fine |
| Needs judgment | nothing mechanical to check | sort it (step 2) |
| Verified | the names in it exist | re-read it if it states status, counts or purpose (step 3) |
| Not checked | system files, external tools | leave it |

If the report says the checkout is behind its upstream, you are reading an old
copy of the file. Check the branch people work on before proposing anything.

## 2. Judge what the checker can't

Sort each "needs judgment" statement into one of two kinds:

- **Rule**: how to work ("Don't refactor things that aren't broken", "No inline
  styles"). Nothing to prove. Keep it unless it contradicts another rule or the
  repo's own tooling, such as a lint config that allows what it forbids.
- **Fact**: a claim about the code ("e2e: Cypress tests", "40+ job types",
  "integrations: Stripe, Twilio…"). Prove it with a file and line, a dependency or
  a command's output. Recount every number.

## 3. Verified is not the same as current

The checker proves names exist, not that the words around them still hold.
Re-check verified lines that state status (active, deprecated, legacy), counts,
brands or ownership. `git log -1 --format='%h %ad %s' -- <path>` shows when a
path last changed; a folder called "active" that nobody touched in years is a
lead.

## 4. Look for what is missing

Compare the file with the repository as it is today: top-level folders,
packages, `package.json` scripts, services in compose files, and the last few
weeks of `git log --stat`. Anything a new session would need and the file
doesn't mention is a gap. Propose one line for each, not a tour.

## 5. Report, then propose the edit

Report a table: line, statement, verdict (true, stale or unclear), evidence,
proposed text. Then show the diff. The file is the user's instructions: apply it
only when asked or approved. Prefer deleting a dead line to rewriting it into
history. Afterwards run the check again; done means 0 stale and every remaining
judgment item kept on purpose.
