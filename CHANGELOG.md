# Changelog

Generated from conventional commits by `npm run changelog`.

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
