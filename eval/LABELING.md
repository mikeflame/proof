# Labeling protocol

Each corpus file is labeled at statement level, as proof splits it (`eval/statements.mjs`), at the
pinned commit. A labeler works blind: no proof report and no earlier label in sight.

| Label | Meaning |
| --- | --- |
| `stale` | The repository contradicts at least one checkable part of the statement. One wrong name, path, command, flag, version, count or concrete example is enough. The evidence cites the contradiction. |
| `true` | The statement describes the repository, and every checkable part is proven: the path exists, the script or target is defined in the file its tool reads, the version floor matches the strictest source, the name is defined (a mention in a comment or inside a string proves nothing), the described behavior is in code that was read. The evidence cites the proof of each part. |
| `judgment` | The repository can neither prove nor contradict it: a convention, a preference, a workflow instruction, a statement of purpose or audience, a claim about people, external systems or the future. A name that exists inside a convention does not make the convention true. |

Order: a contradicted fact makes the statement `stale` before anything else; then a fully proven
description is `true`; everything else is `judgment`. A statement whose substance is a directive,
preference or policy ("work in `packages/*` for editor features", "use anyio, not asyncio") is
`judgment` even when every name in it exists: a correct name inside it does not make it true, and a
wrong one makes it stale.

Evidence is `path:line` with a short excerpt, or a read-only command with its output, at the pinned
commit. A grep hit is not proof of a behavior claim; the code is read. Placeholders (`<name>`,
`path/to/file`, `{var}`) are not claims; a concrete example name is. Every label carries a one-line
note saying what was checked.

A second labeler relabels every statement blind under the same rules. Where the two disagree, a
person adjudicates with the evidence of both in front of them; the adjudication replaces the label
(`adjudicated` in the label file, read by `eval/score.mjs`).

## Review of 2026-10-19

Every one of the 680 labeled statements was relabeled blind by a second agent under this protocol
(`eval/labels/<name>.second.json`). The two passes agreed on 552. The maintainer adjudicated the
128 disagreements with both sides' evidence in front of them:

- 124 were first `true`, second `judgment`: instruction lines whose names and paths exist. The
  directive rule above was adopted and all 124 are now `judgment` (`adjudicated` in the label file,
  with the second labeler's evidence).
- 4 were first `stale`, second `true` or `judgment`. All four stay `stale` (`confirmed` in the label
  file): in each the second labeler had not engaged with the clause the first labeler showed false.
- The second pass found no stale line the first had missed.
