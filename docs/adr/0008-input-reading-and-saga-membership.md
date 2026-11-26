# 8. How a basket is read and which titles are saga episodes

- Status: accepted
- Date: 2026-11-25
- Issues: #4, #30 (parent #1)

## Context

Clerks type or paste titles by hand. The brief does not say how to treat
case, spacing, blank lines or near-miss titles. These assumptions are
pending validation by the production team (#1).

The brief's examples use English titles, but French catalogues list these
films only under their French titles: "Retour vers le futur" with no number
for the first film, then "Retour vers le futur II" in Roman numerals (#30).

## Decision

- **Line splitting** (`\n`, `\r\n`, `\r`) is an input format concern. It
  lives in the HTTP adapter (`readBasketLines`), so a JSON or CSV input
  would only change the adapter.
- **Normalisation** is a domain rule owned by `MovieTitle`: leading,
  trailing and repeated whitespace collapse to one space, and titles match
  ignoring case. A line that is blank once normalised is skipped.
- **Saga membership** is decided by the catalogue. Each episode is
  recognised under its English and French titles, after normalisation and
  by exact match only:

  | Episode | Recognised titles                                                                                           |
  | :------ | :---------------------------------------------------------------------------------------------------------- |
  | 1       | `Back to the Future 1`, `Back to the Future`, `Retour vers le futur 1`, `Retour vers le futur`              |
  | 2       | `Back to the Future 2`, `Back to the Future Part II`, `Retour vers le futur 2`, `Retour vers le futur II`   |
  | 3       | `Back to the Future 3`, `Back to the Future Part III`, `Retour vers le futur 3`, `Retour vers le futur III` |

  The title with no number is episode 1, because it is the first film's
  official title (#4 treated it as a regular movie). Any other non-blank
  line is a regular movie, including `Back to the Future 4`,
  `Retour vers le futur 4`, `Back to the Future Part 2` and `BTTF`.
- The recognised titles are catalogue data in the in-memory catalogue
  adapter. `MovieTitle`, `Cart`, `CartPricing` and the API contract do not
  know about them.
- A cart with no movie left is an `EmptyCartError` (`cart/empty`), a typed
  `Result` failure, never priced at €0.

## Consequences

- A typo makes the title a regular movie at €20. The breakdown (#5)
  shows every line's kind, so the clerk can spot it.
- Fuzzy matching (typos, accents, abbreviations such as `BTTF II`) stays
  out of scope. Another recognised title is one more row in the catalogue,
  not a pricing change.
