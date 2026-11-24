# 7. Amounts are integer euro cents, in one currency

- Status: accepted
- Date: 2026-11-25
- Issue: #4 (parent #1)

## Context

Floating-point euros drift (`0.1 + 0.2`). The shop sells in euros only, so
a `Money` type with a currency per amount would carry a field that never
changes.

## Decision

- Every amount is `EuroCents`: a branded integer, built by `euroCents()`,
  which throws on a non-integer. A plain `number` cannot pass for one.
- The currency is the domain constant `CURRENCY = "EUR"`, sent once at
  the top of the API response.
- A discount is the saga subtotal times the rate, rounded to the nearest
  cent (`Math.round`). With today's prices it always lands on a whole
  cent; a test with a 12.5 % tier pins the rule for future prices.
- The frontend formats cents with the shared `Intl` formatter (`fr-FR`).

## Consequences

- Sums are exact, and an amount that is not an integer fails loudly
  instead of reaching a customer.
- A second currency means replacing `EuroCents` with a `Money` type that
  carries its currency, and dropping the top-level `currency` field.
