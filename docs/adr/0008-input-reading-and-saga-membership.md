# 8. How a basket is read and which titles are saga episodes

- Status: accepted
- Date: 2026-11-25
- Issue: #4 (parent #1)

## Context

Clerks type or paste titles by hand. The brief does not say how to treat
case, spacing, blank lines or near-miss titles. These assumptions are
pending validation by the production team (#1).

## Decision

- **Line splitting** (`\n`, `\r\n`, `\r`) is an input format concern. It
  lives in the HTTP adapter (`readBasketLines`), so a JSON or CSV input
  would only change the adapter.
- **Normalisation** is a domain rule owned by `MovieTitle`: leading,
  trailing and repeated whitespace collapse to one space, and titles match
  ignoring case. A line that is blank once normalised is skipped.
- **Saga membership** is decided by the catalogue. Only
  `Back to the Future 1`, `2` and `3` are saga episodes. Any other
  non-blank line is a regular movie, including `Back to the Future 4`,
  `Back to the Future` with no number and translated titles: no aliases.
- A cart with no movie left is an `EmptyCartError` (`cart/empty`), a typed
  `Result` failure, never priced at €0.

## Consequences

- A typo makes the title a regular movie at €20. The breakdown (#5)
  shows every line's kind, so the clerk can spot it.
- Supporting aliases or fuzzy matching is a catalogue change, not a
  pricing change.
