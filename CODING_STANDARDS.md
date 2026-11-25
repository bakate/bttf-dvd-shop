# Coding standards

Write code a reviewer reads once and trusts. These rules apply to every
contribution, human or agent. Formatting, import order and the lint rules
that Biome and `tsc` enforce are not repeated here: run `pnpm check` and
`pnpm typecheck`.

## Language

- Code, identifiers, commits, ADRs and technical docs are in English.
- The UI and the README are in French.
- Domain concepts use the terms from `GLOSSARY.md`, with no synonyms.

## Architecture

API modules (`apps/api/src/modules/<module>`) follow a light DDD and
hexagonal split, and create only the layers they need:

- `domain`: business rules. No NestJS, no I/O.
- `application`: use cases and ports. No NestJS, no decorators.
- `infrastructure`: adapters that implement ports.
- `presentation`: HTTP. Controllers stay thin: they validate input, call a
  use case and map its result to a response.

A dependency points inward only: `presentation` → `application` →
`domain`. Import modules explicitly, with no barrel `index.ts`. In the API,
an import that climbs out of its directory goes through the `#src/*`
alias (`#src/shared/result`), and an import of the same directory or
below stays relative (`./cart`, `./pricing/pricing.module`); never write
`../` (ADR 0017). A workspace package exposes its
public API through `package.json#exports`.

## Types and errors

- TypeScript is strict. No `any`, and no `as` cast to silence the compiler.
- Data shapes are `readonly`.
- An expected failure (an empty cart, a line too long) is a typed
  `Result` failure, never an exception. `throw` is kept for programmer
  errors and for invalid configuration at startup.
- A domain concept that a primitive would blur gets its own type, such as
  a branded `EuroCents` for an amount in cents.

## Parse at the boundary, trust inside

Untrusted input (HTTP, environment, storage, user input) is validated once,
at the boundary, with a Zod schema, and the inferred type carries the
guarantee inward. Inside the boundary, a value typed `string` is a valid
string: use it directly. Absence is modelled in the schema and the type
(`.optional()`, discriminated unions), so the compiler, not a runtime
check, says when a value can be missing.

The API configuration is the Zod-validated `AppConfig`. Read it through
`ConfigService<AppConfig, true>` with `{ infer: true }`, never through a
string key with a cast or through `process.env`.

## Single source of truth

Every shared constant, list or type lives in one module and is imported
everywhere else, tests included. A route prefix, an error code or a
user-facing text is written once. Tests import the production values
(`API_GLOBAL_PREFIX`, the messages module, the example carts) instead of
copying them, so a change in one place reaches the whole suite.

## Lookup tables for value mapping

When code maps one value to another, write a typed lookup object and index
it. Keep `if` and `switch` for genuinely different behaviour.

```ts
const httpStatusByCartError = {
  "cart/empty": 400,
  "cart/too-many-lines": 400,
  "cart/line-too-long": 400,
} as const satisfies Record<CartErrorCode, number>;
```

`satisfies Record<…>` makes the compiler flag the missing entry when a new
code is added.

## Named arguments from three parameters

A function that takes three or more parameters takes one object instead,
and every call passes it with named properties. The call then reads
without opening the function, and adding a parameter changes no existing
call.

```ts
priceCart({ cart, discountTiers, catalog });

// Not: priceCart(cart, discountTiers, catalog)
```

A rest parameter (`...parts`) does not count. When the same values always
travel together, such as a cart and its catalogue, a type that owns them
reads better than a parameter object.

## Named intent over clever chains

Choose the pipeline a reader parses in one pass: `map` and `filter` over
`reduce` for transformations. When a chain encodes an idea, extract it
into a small named function (`countDistinctEpisodes`) so the call site
states the intent.

## Honest complexity

Know the Big O of every loop. A search inside a loop (`find`, `includes`,
`indexOf`) makes it quadratic: build a `Map` or a `Set` once, before the
loop.

## YAGNI

Build what the current issue asks for. Options, parameters and
abstractions arrive with their second real caller.

## Comments only when essential

No comment by default. A comment stays only for a why the code cannot
show, in one line when it can:

- **security**: what keeps a secret or a stack trace out of a response or
  a log;
- **privacy**: what personal data must not leave, and why;
- **a workaround** for a bug in a library, a runtime or a browser;
- **an external constraint**: a protocol, an RFC, a provider's limit, a
  rule another tool depends on.

Everything else is removed: what the code does, a name, a signature, an
error message repeated, the history of a change. A precise name and a
precise error already document the code, and Git keeps the history.

```ts
// RFC 9457: clients match on `type`, so codes never change once published.
const problemTypes = { emptyCart: "cart/empty" } as const;

// Not: "priceCart prices the cart."
```

A type gets a doc comment only when it holds an invariant a reader could
break. The same rule applies to configuration files (YAML, JSON with
comments).

## Tests

- A test is a behaviour scenario observed through a public seam: the
  pricing domain service, the HTTP contract, the rendered screen, or the
  running container. It never asserts private structure, so an internal
  refactor does not break it.
- Its name reads as a sentence in domain language:
  `Given …, when …, then …`.
- Wiring, transport and fixtures live behind a package-local
  `createSystemUnderTest` helper. The scenario body reads as Given, then
  one When (a single action), then Then (the observed result).
- Each scenario goes red when the behaviour it names breaks. Check it once
  by breaking the code.
- Screen tests query by role and import expected texts from the messages
  module.
- A pull request tests one seam, in one test file.

## UI

- Every user-facing text lives in the messages module. Prices and rates
  go through the shared `Intl` formatters.
- Every style value comes from the theme. A missing token is added to the
  theme, never inlined.
- Every control works with the keyboard and shows a visible focus ring.
- Conditional rendering is a ternary with an explicit `null` branch, never
  `&&`. A falsy `0` or `""` on the left of `&&` renders as text, and the
  ternary states both outcomes.

```tsx
{
  pricing.data === undefined ? null : <PriceBreakdown price={pricing.data} />;
}

// Not: {pricing.data !== undefined && <PriceBreakdown price={pricing.data} />}
```

`pnpm check:ui-conventions` enforces the first two rules in CI and on
commit (ADR 0003).

## Commits and pull requests

- Pull requests are squash-merged, so the pull request title becomes the
  commit on `main`. It follows
  [Conventional Commits](https://www.conventionalcommits.org/) like local
  commits, which only the `commit-msg` hook checks.
- A pull request holds a single commit: amend it rather than stacking
  fix-up commits.
- The description references its issue (`Closes #2`, `Refs #1`).
- A decision a newcomer would ask about is recorded as a short ADR in
  `docs/adr`.
