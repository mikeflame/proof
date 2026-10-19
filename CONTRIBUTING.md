# Contributing

proof is small on purpose. `VISION.md` says what it is, what it is not and which changes it resists:
read it before proposing a feature.

## Report a wrong result

The most useful report is a statement proof got wrong: a true line reported stale, a stale line it
missed, a VERIFIED the repository does not prove, or a wrong fix. Open an issue with the **Wrong
result** form. It asks for a public repository and commit where it happens, so the result can be
reproduced and turned into a test.

A crash or an error message that makes no sense goes in the **Crash or error** form. A security
problem goes through `SECURITY.md`, never a public issue.

## Change the code

Development needs git and a current release of Node 22 or newer: the build imports the TypeScript
sources directly, which early Node 22 releases cannot do.

```bash
npm ci
npm test         # builds the bundle and its grammars, then runs every test against it
npm run gate     # what CI runs: generated files current, types, tests, no stale line in AGENTS.md or README.md
```

The rules for changing proof are in `AGENTS.md`, which coding agents read too. The ones that most
often decide a review:

- Edit `src/`, never a generated file, and commit what `npm run build` regenerates.
- Every rule in `src/verify/` comes with a test whose fixture fails without it.
- An uncertain check reports unconfirmed, never stale.
- No code, paths or wording from an employer or client in fixtures or docs.
- The held-out half of the evaluation corpus is never used for tuning (`eval/LABELING.md`).

One change per pull request, titled as a conventional commit (`fix:`, `feat:`, `docs:`): `CHANGELOG.md`
is generated from those titles.
