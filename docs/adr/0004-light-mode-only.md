# 4. Light mode only

- Status: accepted
- Date: 2026-11-24
- Issue: #3 (parent #1)

## Decision

`MantineProvider` forces the light colour scheme. A dark mode would double the colour pairs to keep at WCAG AA and the screens to test, for no requirement in the brief. The resolver keeps an empty `dark` section, so adding one later means filling it and lifting the forced scheme.

## Consequences

A user whose system prefers dark mode still gets the light theme.
