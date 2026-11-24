# 3. Theme tokens and messages, checked by one script

- Status: accepted
- Date: 2026-11-24
- Issue: #3 (parent #1)

## Context

Every style value must come from the theme and every text from the messages module, without reviewers policing it. The app is one screen, so the guard must stay proportionate.

## Decision

- The Mantine theme (`apps/web/src/theme/theme.ts`) holds every raw value. Its CSS variables resolver adds the few tokens Mantine lacks, as `--mantine-*` variables. Fonts are self-hosted with Fontsource. A missing token is added to the theme, never inlined.
- `apps/web/src/global.css` is the only stylesheet. Its variables are `var(--mantine-*)` only, and it has no media queries: responsive layout uses Mantine responsive props.
- `scripts/check-ui-conventions.mjs` runs in CI and in lint-staged. It is one plain Node script, not a package: nothing else imports it, so it needs no build step and no configuration.
- The rule targets magic numbers: a length or duration with a unit (`14.5px`, `200px`, `150ms`) or a colour (hex, colour functions) outside the theme. Unitless numbers and percentages (`z-index`, `translateY(-200%)`) are allowed.
- Regexes handle stylesheets (other files, raw values in declarations, media queries) and `style={` in components.
- A minimal TypeScript AST pass handles what a regex cannot read reliably: literal JSX text and literal `label`, `placeholder`, `title` and `aria-label` props, including through a ternary, a concatenation or a `&&`; and raw values inside string literals only, so comments, in-page anchors (`href`) and the messages module are not taken for styles.

## Consequences

- A breach fails on commit and blocks the merge.
- The check is a guard, not a proof. A value built at runtime, a raw number in a Mantine prop, a CSS named colour or props passed through a spread (`{...{ style }}`, `{...{ label: "…" }}`) pass it, and `style={` inside a comment is reported. Reviews own those cases.
