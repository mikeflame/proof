# Security

## Reporting a vulnerability

Report it privately through GitHub: the repository's **Security** tab, then **Report a vulnerability**.
Do not open a public issue for it.

## What counts

proof runs an agent over repositories that may not be yours, so these matter most:

- an agent call doing more than its read-only tools allow, or a repository's content getting it to,
  for example running a command outside the read-only list or writing a file;
- a command cited as evidence that proof re-runs although it is not read-only;
- proof writing anywhere but the instruction file it fixes, the sidecar next to it and its cache;
- a repository's own Claude Code settings, hooks or instruction files taking effect inside proof's
  agent calls.

A verdict that a repository's content talks the verifier into, with citations that check out, is a
wrong result rather than a vulnerability: report it with the **Wrong result** issue form.

## Supported versions

Fixes land on the default branch and in the next release. Only the latest release is supported.
