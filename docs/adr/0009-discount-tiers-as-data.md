# 9. Discount tiers are data

- Status: accepted
- Date: 2026-11-25
- Issue: #4 (parent #1)

## Context

The promotion will change: a new tier or a new rate must not touch the
pricing algorithm.

## Decision

- `DISCOUNT_TIERS` is a list of `{ distinctEpisodesThreshold, rate }`:
  3 → 20 %, 2 → 10 %.
- `CartPricing` receives the tiers as input and applies the tier with the
  highest threshold the cart reaches. The order of the list does not
  matter.
- The tier depends on the number of **distinct** episodes, and its rate
  applies to the **whole** saga subtotal, duplicates included.

## Consequences

- A new tier is a new row. Seam A tests can pass their own tiers, which is
  how the rounding rule is tested.
- Tiers live in code, not in configuration: changing them is a reviewed
  pull request, like any business rule.
