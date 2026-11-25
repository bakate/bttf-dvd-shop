# 11. Tabler icons, decorative only

- Status: accepted
- Date: 2026-11-25
- Issue: #5 (parent #1)

## Context

Text alone made the screen flat: the clerk scans for the action, the kind
of each line and the discount. Mantine ships no icons.

## Decision

- Use `@tabler/icons-react`, the set Mantine documents, pinned to an exact
  version at least two weeks old. Icons are tree-shaken per import.
- Every icon is decorative: `aria-hidden`, next to a text that carries the
  meaning. No control is an icon alone.
- Icon sizes come from `iconSizes` in the theme, like every style value
  (ADR 0003).
- A movie's kind is a badge: `outline` in the primary colour for a saga
  episode, `default` for a regular movie. Both keep text at WCAG AA, which
  Mantine's `light` variant does not reach with `flux`.

## Consequences

- Accessible names do not change, so screen tests need no icon queries.
- A new icon is an import, not a new dependency.
