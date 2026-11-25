# 14. The screen's safety net for unexpected failures

- Status: accepted
- Date: 2026-11-25
- Issue: #7 (parent #1)

## Context

A clerk must never face a blank screen or a silent button. An API cold
start on Render takes about 30 s, a bug can throw while rendering, and an
expected cart error must keep its own message (ADR 0012).

## Decision

- `api-client.ts` owns how the app talks to the API. The generated client
  is created through its `createClientConfig` (hey-api's
  `runtimeConfigPath`), so every request gets the base URL and a 15 s
  timeout with no code at the call site. A timeout becomes a
  `RequestTimeoutError`.
- `classifyRequestError` sorts any failure into one of three kinds:
  `client-problem` (a 4xx problem detail), `timeout` or `unexpected`.
  Callers index their handling by kind, so a new kind fails the build
  until each of them handles it.
- The pricing screen translates a `client-problem` (ADR 0012) and shows a
  `timeout` in place, as a "service not responding" alert with a retry
  that resends the same basket.
- A global `MutationCache` `onError` reads one table: it ignores a
  `client-problem`, reports a `timeout` without notifying it (the screen
  already shows it), and reports and notifies an `unexpected` error
  (5xx, network) with one generic message.
- A root error boundary inside the providers replaces the page with a
  fallback screen whose reset remounts the app. The basket is held above
  the boundary, so the clerk gets it back after the reset. Notifications
  stay outside it, so they survive.
- `reportError` is the single exit for errors: the mutation handler, the
  React root (`onCaughtError`, `onUncaughtError`, `onRecoverableError`)
  and the `window` `error` and `unhandledrejection` listeners all call
  it. It logs to the console for now. It is the one place to plug a
  monitoring service.
- This supersedes ADR 0012's interim note that every failed pricing call
  shows a notification.

## Consequences

- The reset drops the last price and any pending request, not the
  basket.
- The timeout scenarios run on fake timers, so the suite does not wait
  15 s and still exercises the real timeout and the real generated client.
- The `window` listeners and React root options sit in `main.tsx`, which
  the screen tests do not render.
- This ticket tests two seams, B and C, because its criteria require both,
  as in ADRs 0010 and 0012.
