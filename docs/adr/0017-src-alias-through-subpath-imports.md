# 17. API modules import each other through a `#src/*` subpath import

- Status: accepted
- Date: 2026-11-25
- Issue: #21 (parent #1)

## Context

API files reached shared modules through relative paths up to
`../../../`, whose depth changed with the importing file's location. The
API is compiled by `tsc` to CommonJS and run as `node dist/main.js`. `tsc`
does not rewrite import specifiers, so a `tsconfig` `paths` alias would
type-check and then fail to resolve in the built server, unless a
rewriting tool such as `tsc-alias` ran after every build.

## Decision

- `apps/api/package.json#imports` maps `#src/*` to `./src/*.ts` under the
  `development` condition and to `./dist/*.js` by default. Node, TypeScript
  and Vite read this field natively, so no dependency is added and the
  emitted `require("#src/…")` is resolved by Node itself.
- Every tool that runs the sources sets the `development` condition:
  - `tsc`: `customConditions: ["development"]` in `apps/api/tsconfig.json`,
    which `moduleResolution: Node16` accepts. The build inherits it, so
    `tsc` reads the sources it compiles.
  - `tsx` (`dev`, `generate:openapi`): `--conditions=development`.
  - Vitest: `ssr.resolve.conditions`, since the `node` environment
    resolves through Vite's SSR resolver and ignores the top-level
    `resolve.conditions`.
- The production image passes no condition and resolves to `dist/`.
- Only imports that climb out of their directory (`../`) use the alias.
  An import of the same directory or below (`./`) stays relative.
- Biome's import sorter already groups `#` aliases between packages and
  relative paths, so its configuration is unchanged.

## Consequences

- A file moves without its imports of other directories changing, and
  every cross-directory import reads from the same root. The cost: imports
  between layers of one module now name the module
  (`#src/modules/pricing/domain/movie`), so renaming a module edits every
  file in it.
- Vitest must keep the explicit condition. Vite's default conditions turn
  `development` into `production` when `NODE_ENV=production`, which
  `turbo.json` passes through; `#src/*` then loads a stale `dist/` if one
  exists, or fails if it does not.
- Without `customConditions`, `tsc` would still type-check, by mapping
  `dist/*.js` back to `src` through `outDir` and `rootDir`. The condition
  keeps one explicit rule for every tool instead of relying on that
  mapping.
