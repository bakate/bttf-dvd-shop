# 5. One typed messages module, no i18n library

- Status: accepted
- Date: 2026-11-24
- Issue: #3 (parent #1)

## Context

The UI is French only, yet every text must change in one place and a second language must stay possible. An i18n library brings runtime loading and string keys for a single locale.

## Decision

- Every user-facing text, including the document title and meta description applied at startup, lives in the typed `as const` object `apps/web/src/messages.ts`. A text with parameters is a function.
- Prices and rates go through the `Intl` formatters in `apps/web/src/format.ts` (`fr-FR`, EUR). A rate is a fraction (`0.2` → `20 %`).
- The page language is set statically with `lang="fr"`.

## Consequences

- A missing key is a compile error, and screen tests import their expected texts from the module.
- A second language swaps the object for a library lookup at each call site: a mechanical change.
