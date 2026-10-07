# Changelog

Generated from conventional commits by `npm run changelog`.

## v0.3.0

### Documentation

- criterion 6 on the tuning monorepo: second run 0 fixes, 0 stale, 0 reopened; one edited decision reopens exactly it (6f55a7f)
- spec status per criterion; README explains the held-out check row; after-held-out check numbers recorded apart (194b504)
- README reports the scored tune split (a5fbc42)

### Fixes

- a true verdict whose own reason says the claim is not shown stays open (a hook the verifier saw but could not show loaded was VERIFIED) (c1c0923)
- an edit stays inside its own statement, and the empty-subject guard reads the statement's whole line (a deletion took 'Currently empty.' with it) (6a991a8)
- a fix the fixer wrapped onto more lines is joined back onto the lines it replaces; new structure is still refused (24ee00f)
- facts inside a rule are still facts: a wrong exemption or naming scheme stays stale (prompt v6) (130e145)
- a convention written as a description stays open when some code breaks it, and the fixer never rewrites it to the exceptions (prompt v5, from the tuning monorepo) (363c7ec)
- MSBuild files, placeholder project names, bot commands, {name} templates (278bf3c)
- stale means false, not incomplete; a rule the code breaks stays open (verifier rules, from tune-split scoring) (03eeed6)
- parallel verifier calls reserve their share of the budget; README reports the evaluation (b0a07ec)
- member claims are checked against their type; examples stay open (d0564a2)

### Other

- tune split re-measured at 6a991a8 (verdicts from cache, fixes reviewed independently); spec status records the post-freeze fixer guards and the reverted v5/v6 verifier rule (a795668)
- revert the v5/v6 verifier rule: it left false facts with a 'never' open (lost two gold stale lines on the tune split); keep the fixer rule that never rewrites a convention to its exceptions; verifier prompt is v4 again (44256c5)
- Merge post-heldout: root causes of the held-out false alarms, .NET/Java/PHP version sources (7bd47be)
- .NET from global.json and target frameworks, Java from the build, PHP platform pin (c18f018)
- held-out split run once on the frozen build and scored; fix reviews for both splits (15077c0)
- tune split scored on the full pipeline; two labels adjudicated with evidence; tuning frozen here (79a4318)

## v0.2.0

### Other

- independent labels for the tune split (python-sdk, spring-ai, gh-cli) (e3abe40)
- /proof:claude-md, a skill that proves CLAUDE.md is still true (717db82)

### Tests

- run the option check in a scratch folder; remove the report folder it left in the repository (b748929)
- give fixture repositories a git identity, as CI runners have none (ef52d8e)

### Documentation

- VISION.md, what proof is, is not, and which changes to resist (spec 9.7) (7566e96)

### Fixes

- keep the README matrix out of the dogfood check, add npm run gate, inject the version at build (9d176c0)
- a bare /path with no command or skill is checked as a URL route (3611a85)

### Features

- universality matrix and eval scaffolding (phase 6, part 1) (336dfdf)
- verification pipeline, phase 5: generated surfaces, CI, release, install (007f2fb)
- verification pipeline, phase 4: autofix, re-verify, decisions (5fed345)
- verification pipeline, phase 3: agent verification stage (42adfc0)
- verification pipeline, phase 2: discovery and imports (36f7005)
- verification pipeline, phase 1: correct mechanical layer (167a36e)
