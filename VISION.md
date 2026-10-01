# Vision

proof keeps the instruction files of coding agents true. A CLAUDE.md or AGENTS.md is read before
every session; when it is wrong, every session starts from the wrong map. proof checks every
statement against the repository, fixes what is stale, and shows the evidence for both.

## What proof is

- **One pipeline**: discover the files an agent loads, parse them into statements, check what a
  parser can check, hand the rest to a verifier agent, fix what is stale, re-verify each fix with a
  fresh agent, record what was decided, report.
- **One skill** that drives the pipeline and relays to a person what needs a person.
- **A record**: every fix, rejected fix and decision lives in a sidecar next to the file, bound to
  the tree and the commit it was made at.

## What it is built on

| | Decision |
| --- | --- |
| D1 | Quality and universality over speed. A run may take minutes; it must work on any language, toolchain and repository shape, and dependencies are fine when they buy correctness. |
| D2 | Autofix is the product. proof fixes the file by default; the person reviews the diff afterwards. |
| D3 | Evidence over confidence. Every verdict and every fix cites inspectable evidence that proof re-checks. An uncertain check reports unconfirmed, never stale and never verified. |
| D4 | Fail closed, degrade loudly. A check that cannot run says so and keeps its statement open. Nothing is dropped silently. |
| D5 | Human decisions are facts. A decision is replayed on every later run and asked again only when its line changes. |

## What proof is not

- Not a documentation generator. It corrects what is wrong; it never adds content to close a gap
  unless asked (`--gaps`), and then it proposes, never writes.
- Not a prose linter. Style, tone and length are not its business.
- Not a daemon, a TUI, a git proxy or a hosted service.
- Not a judge of taste. Rules are checked against the repository's own tooling, never against what
  proof would prefer.

## Changes to resist

- A check that turns an error into "not found", or a verdict that passes by default.
- Evidence that cannot be inspected: a model's confidence, a match in a comment, a name found only
  inside a longer string.
- A fix that the fixer certifies itself, or one that adds lines.
- A second source for anything the report, the CLI help, the skill and the README share: they are
  generated from `src/vocabulary.ts` and drift-tested.
- Tuning on the held-out half of the evaluation corpus.
- Surface area: a second command where an option would do, a second skill, a configuration knob
  that loosens D3 or D4.
