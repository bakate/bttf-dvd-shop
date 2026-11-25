# 5. One typed messages module, no i18n library

- Status: accepted
- Date: 2026-11-24
- Issue: #3, consolidated in #10 (parent #1)

## Context

The UI is French only, yet every text must change in one place and a second language must stay possible. An i18n library brings runtime loading and string keys for a single locale.

## Decision

- Every user-facing text, including the document title and meta description applied at startup, lives in the typed `as const` object `apps/web/src/messages.ts`. A text with parameters is a function.
- Prices and rates go through the `Intl` formatters in `apps/web/src/format.ts` (`fr-FR`, EUR). A rate is a fraction (`0.2` → `20 %`).
- The page language is set statically with `lang="fr"`.

## Consequences

- A missing key is a compile error, and screen tests import their expected texts from the module.
- The API never sends French: it sends stable codes (ADR 0012), which the screen translates through the module. A second language needs no API change.
- When a second language becomes a requirement, the migration is:
  1. Add a library (`react-i18next` or `@formatjs/intl`) and turn `messages.ts` into the `fr` resource, keeping its shape. A parameterised function becomes an interpolated string.
  2. Type the keys from that resource, so a missing key stays a compile error.
  3. Replace each `messages.x.y` with the library's lookup. The call sites are the module's importers: the change is mechanical.
  4. Build the `Intl` formatters from the active locale instead of `fr-FR`, set `lang` at runtime, and let screen tests read the `fr` resource.
