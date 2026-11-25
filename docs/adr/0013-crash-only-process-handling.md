# 13. Crash-only process handling

- Status: accepted
- Date: 2026-11-25
- Issue: #7 (parent #1)

## Context

An error a request handler throws is caught by the global filter, but an
error thrown outside a request (a timer, a stray promise) leaves the
process in a state nobody can check. Keeping it running risks wrong
prices or a leak; the container platform already restarts a process that
exits.

## Decision

- Inside a request, the global filter turns any unknown error into a
  generic `server/internal` 500. Its stack goes to the logs, at `error`
  level, under the request id, and never into the response.
- Outside a request, `exitOnFatalError` listens for `uncaughtException`
  and `unhandledRejection`: it logs the error at `fatal` level, closes the
  app (shutdown hooks let in-flight requests finish) and exits with code
  1. A 10 s timer forces the exit if closing hangs. A second fatal error
     during shutdown is logged and does not start another shutdown.
- Logs are pino JSON on stdout through `nestjs-pino`. Each request gets a
  random UUID, logged as `req.id` and returned in `X-Request-Id`, so a
  clerk's report leads to its log lines. The request and response
  serializers are an allowlist (`id`, `method`, `url`; `statusCode`): no
  header, cookie or basket is ever logged.

## Consequences

- Recovery is the platform's job: Docker Compose and Render restart the
  container. A process never tries to repair itself.
- The crash handlers run only in `main.ts`, so no test seam covers them;
  they were checked by hand against a real uncaught error. The container
  seam (D) is where an automated check would go.
- The handlers are installed once the app exists. A failure before that
  (an invalid configuration) is an unhandled rejection with no listener:
  Node prints it and exits with code 1, which is still crash-only, but
  without a pino record.
- `nestjs-pino` keeps the first log destination for the whole process. The
  API test helper therefore shares one log collector between the apps of
  a test file.
