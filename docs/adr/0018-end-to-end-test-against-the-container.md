# 18. End-to-end tests run against the built container

- Status: accepted
- Date: 2026-11-25
- Issue: #9 (parent #1)

## Context

The screen tests mock the API and the HTTP tests skip the browser, so
nothing proves that the image a reviewer runs serves a page that prices a
cart. jsdom also does not follow in-page anchors, so the skip link cannot
be checked at the screen seam.

## Decision

- Seam D is Playwright, in `apps/web/e2e`, on Chromium only. It lives in
  the web package so it imports `messages`, the `Intl` formatters and the
  locators' texts from `src` like the screen tests, with no new workspace.
- It covers two scenarios: the brief's fifth example priced end to end
  (total and breakdown), and the skip link moving focus to `main`.
  Every other behaviour stays at the cheaper seams.
- The suite targets `http://localhost:3000` and never starts the app
  itself: the caller runs the container. `pnpm test:e2e` is outside
  `pnpm test`, which needs neither Docker nor a browser.
- In CI, the quality gate runs the image it just built with a 2 s health
  interval, waits up to 60 s for Docker to report it `healthy` (and prints
  its logs if not), installs Chromium and runs the suite. A failed run
  uploads `apps/web/test-results` (the traces) as an artifact.

## Consequences

- The gate now needs a browser download on every run, which adds about
  a minute. Caching it waits until that time matters.
- Locally, the container must be running first:
  `docker compose up --build --wait`, then `pnpm test:e2e`. The image's
  30 s health interval makes `--wait` slower than CI.
