# 19. The frontend has no state machine and no gateway layer

- Status: accepted
- Date: 2026-11-25
- Issue: #10 (parent #1)

## Context

The template's sample feature used XState, and a client port in front of
the API is common in hexagonal frontends. The screen has one form and one
request: idle, pending, priced or failed.

## Decision

- No XState. TanStack Query's `useMutation` (`use-price-cart.ts`) already
  models the request's states (`isPending`, `data`, `error`), and the
  basket is one React state. A machine would restate them in a second
  place.
- No gateway or port between the screen and the API. The client generated
  from the OpenAPI contract is the port: its types come from the API, and
  `check:api-contract` keeps them current. `api-client.ts` sets its base
  URL and timeout once (ADR 0014).
- Screen tests mock the network with MSW, so they run the real generated
  client without a hand-written fake.

## Consequences

- A screen change touches one component and its hook, with no state chart
  to keep in step.
- A flow with real transitions (several steps, guards, cancellation) would
  justify a machine. It would arrive with that feature, scoped to it.
