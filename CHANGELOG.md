# Changelog

Generated from conventional commits by `npm run changelog`.

## Unreleased

### Fixes

- verifier and fixer reasons are kept whole, not cut at 600 characters (f65c1cf)
- an older Node gets a message naming the version proof needs, not a SyntaxError (0cdcf8b)
- --budget-usd is the run's total: fixing and re-verifying draw on what is left (0b9e290)
- reasons a person must read print in full, and proof decide lists the verifier's reasons (3f99f37)
- an empty PROOF_CLAUDE means unset, not a binary path (it crashed with ERR_INVALID_ARG_VALUE) (43239c4)

### Documentation

- contributing guide, security policy, issue forms and a pull request template (b1aa9f1)
- README says what proof run can touch and what it costs (f226d09)
- the spec is docs/spec.md, introduced as the design reference rather than a rework plan (7edc91e)
- the skill no longer has the agent check Node, git and claude first; proof names what is missing (acb2458)
- the README no longer calls the repository private; the skill carries proof's own LICENSE (82ed836)

### Other

- every label relabeled blind by a second agent; the 128 disagreements adjudicated (128b3f1)
- committed results name the corpus folder as <corpus>, never this machine's path (6e62bfe)

## v0.3.0

### Documentation

- criterion 6 on the tuning monorepo: second run 0 fixes, 0 stale, 0 reopened; one edited decision reopens exactly it (0d09045)
- spec status per criterion; README explains the held-out check row; after-held-out check numbers recorded apart (01a1b08)
- README reports the scored tune split (1eaf514)

### Fixes

- a true verdict whose own reason says the claim is not shown stays open (a hook the verifier saw but could not show loaded was VERIFIED) (65301af)
- an edit stays inside its own statement, and the empty-subject guard reads the statement's whole line (a deletion took 'Currently empty.' with it) (6904b11)
- a fix the fixer wrapped onto more lines is joined back onto the lines it replaces; new structure is still refused (cb789a0)
- facts inside a rule are still facts: a wrong exemption or naming scheme stays stale (prompt v6) (935b0ea)
- a convention written as a description stays open when some code breaks it, and the fixer never rewrites it to the exceptions (prompt v5, from the tuning monorepo) (9e355d8)
- MSBuild files, placeholder project names, bot commands, {name} templates (e26eedd)
- stale means false, not incomplete; a rule the code breaks stays open (verifier rules, from tune-split scoring) (409e6a7)
- parallel verifier calls reserve their share of the budget; README reports the evaluation (4a6b55e)
- member claims are checked against their type; examples stay open (73a11d8)

### Other

- tune split re-measured at 6904b11 (verdicts from cache, fixes reviewed independently); spec status records the post-freeze fixer guards and the reverted v5/v6 verifier rule (33d1273)
- revert the v5/v6 verifier rule: it left false facts with a 'never' open (lost two gold stale lines on the tune split); keep the fixer rule that never rewrites a convention to its exceptions; verifier prompt is v4 again (e0a94a3)
- Merge post-heldout: root causes of the held-out false alarms, .NET/Java/PHP version sources (6aab6ef)
- .NET from global.json and target frameworks, Java from the build, PHP platform pin (b00cc98)
- held-out split run once on the frozen build and scored; fix reviews for both splits (3c9c46e)
- tune split scored on the full pipeline; two labels adjudicated with evidence; tuning frozen here (2e38c1b)

## v0.2.0

### Other

- independent labels for the tune split (python-sdk, spring-ai, gh-cli) (3f88915)
- /proof:claude-md, a skill that proves CLAUDE.md is still true (ee4d272)

### Tests

- run the option check in a scratch folder; remove the report folder it left in the repository (197d2ad)
- give fixture repositories a git identity, as CI runners have none (265ffb2)

### Documentation

- VISION.md, what proof is, is not, and which changes to resist (spec 9.7) (6819b9e)

### Fixes

- keep the README matrix out of the dogfood check, add npm run gate, inject the version at build (48768f0)
- a bare /path with no command or skill is checked as a URL route (7e655ae)

### Features

- universality matrix and eval scaffolding (phase 6, part 1) (f98d1d1)
- verification pipeline, phase 5: generated surfaces, CI, release, install (5a008c3)
- verification pipeline, phase 4: autofix, re-verify, decisions (442ee9e)
- verification pipeline, phase 3: agent verification stage (b11803e)
- verification pipeline, phase 2: discovery and imports (fd47bab)
- verification pipeline, phase 1: correct mechanical layer (a9b44cf)
