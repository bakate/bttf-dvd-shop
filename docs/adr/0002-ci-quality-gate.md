# 2. One required quality gate on every pull request

- Status: accepted
- Date: 2026-11-24
- Issue: #2 (parent #1)

## Context

`main` must always be releasable, and a team must be able to rely on the
checks without reviewers enforcing them by hand. The template's CI only ran
tests and the contract check, on pushes to `main` and `staging`, so a
broken change was only caught after it had merged.

## Decision

- A single `Quality gate` job runs on every pull request and on every push
  to `main`, in this order: Biome check, typecheck, tests, build, API
  contract check, `pnpm audit`. Later tickets add their steps to this job
  (UI conventions check, Docker image build, end-to-end test).
- `main` is protected: merging requires a pull request with `Quality gate`
  green and the branch up to date.
- `pnpm audit` is blocking, at every severity. When an advisory has no
  upstream fix, a pnpm `overrides` entry pins the patched release, scoped
  to the dependency that pulls it in and within the same major, with a
  comment saying when to remove it. Today:
  `@hey-api/json-schema-ref-parser>js-yaml` → 4.3.2.
- Third-party actions are pinned to a commit SHA (with the tag as a
  comment), and the workflow token is read-only.
- Dependabot opens weekly npm and GitHub Actions updates, with minor and
  patch releases grouped.

## Consequences

- A new advisory published against an existing dependency can turn an
  unrelated pull request red. That is intended: the fix is a dependency
  bump or an override in its own pull request.
- Renaming the job means updating the branch protection rule in the same
  change.
