# 1. Bootstrap from the author's template and stack, on Node 26 LTS

- Status: accepted
- Date: 2026-11-24
- Issue: #2, consolidated in #10 (parent #1)

## Context

The project needs a production-ready base on day one: monorepo, NestJS API,
React frontend, strict TypeScript, linting, tests, commit conventions and an
OpenAPI contract. The author maintains a Turborepo template that already
provides all of these, plus a sample "todos" feature and a commented-out
Vercel deploy.

## Decision

- Keep the template's stack, each piece for a present need:
  - **Turborepo + pnpm workspaces**: the API, the frontend and the shared
    tooling version together, and one command builds or tests them all.
  - **NestJS**: modules and dependency injection give the hexagonal split
    (ports, adapters) a home without hand-written wiring, and its Swagger
    module generates the OpenAPI document the frontend types come from.
  - **Zod**: one schema validates untrusted input and infers its type,
    for the HTTP contract (ADR 0016) and the configuration.
  - **React + Vite + Mantine**: a component library with an accessible
    base and a theme that holds every style token (ADR 0003).
  - **TanStack Query**: one mutation per price request, with its pending
    and error state (ADR 0019).
  - **Biome, Vitest, Husky, Commitlint**: one fast linter and formatter,
    one test runner for both apps, and conventions checked on commit.
- Start from the template and remove everything that was only there as an
  example: the todos feature (API and web), XState and the other
  dependencies only the sample used, the `ZodValidationPipe` (#6 replaces
  its error envelope with RFC 9457 problem details), the unused
  `PUBLIC_BASE_URL` / `WEB_APP_URL` settings, and the Vercel job.
- Keep the template's shared `Result` type. The pricing domain uses it for
  expected failures (#4).
- **Node 26 LTS** is the only supported runtime. `.nvmrc` holds the major,
  `engines.node` sets the floor at `^26.13.0` (first LTS release), and pnpm
  `engineStrict` makes install fail on another version. CI reads `.nvmrc`.
- Stay on the current majors (NestJS 11, Vitest 4, Vite 8, TypeScript 6,
  React 19, Mantine 9). They all run on Node 26, and every security
  advisory has a fix inside those majors. Major upgrades (NestJS 12,
  Vitest 5, TypeScript 7) are separate Dependabot pull requests, not
  bootstrap work.
- Biome runs once from the repository root, and nested configurations
  extend it with `"//"`. The template's relative `extends` did not follow
  the root's own `extends`, so the apps were silently formatted with tabs
  instead of the shared 2-space style.

## Consequences

- A clone installs, builds and tests with the documented commands, on one
  Node version.
- The template sample is gone, so `git grep -i todo` finds nothing to
  delete later.
- The template fixes found here (Biome `extends`, scripts, README) are
  backported to the template after delivery (out of scope, see #1).
