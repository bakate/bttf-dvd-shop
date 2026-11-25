# 10. The price breakdown, in the API and on screen

- Status: accepted
- Date: 2026-11-25
- Issue: #5 (parent #1)

## Context

A clerk must explain a price, and a reviewer must check every rule of the
brief in seconds. A bare total shows neither which titles were recognised
nor which tier applied.

## Decision

- `POST /api/cart/price` answers the whole **PriceBreakdown**: `lines`
  (title as first typed, `kind` `saga-episode` or `regular-movie`,
  `unitPrice`, `quantity`), `sagaSubtotal`, `distinctSagaEpisodeCount`,
  `discountRate`, `discount`, `regularSubtotal`, `total` and `currency`.
  Amounts stay integer cents (ADR 0007).
- A line groups the copies of one title, matched like the catalogue
  matches titles (ignoring case and whitespace), in the order each title
  first appears. The API groups them because title matching is a domain
  rule (ADR 0008): the screen would otherwise copy it.
- `discountRate` is always present and `null` when the cart reaches no
  tier, so a client never mistakes a missing field for "no discount".
- The domain `PriceBreakdown` carries the same facts. The controller only
  maps them (title text, quantity, `undefined` to `null`).
- The screen shows one table with a caption, column headers and row
  headers, inside the result's `status` live region, so it is announced
  with the total. The discount is shown as a negative amount so the
  column visibly adds up to the total.
- The five example carts of the brief live once, in `example-baskets.ts`.
  The screen and the tests import them. The sixth reference example of #1
  (€40.50) is not from the brief and gets no button.

## Consequences

- A new breakdown field is a contract change: regenerate the OpenAPI
  document and the frontend types (`pnpm generate:api`).
- The live region reads the whole table. That suits carts of a few lines.
  If long carts become common, announce the total only.
- This ticket tests two seams, B and C, because its criteria require
  both. It is an exception to "one seam per pull request", not a new rule.
