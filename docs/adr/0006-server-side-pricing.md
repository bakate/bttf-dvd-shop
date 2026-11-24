# 6. The API owns every pricing rule

- Status: accepted
- Date: 2026-11-25
- Issue: #4 (parent #1)

## Context

The price must be the same wherever it is asked for, and the rules must be
tested in one place. The screen could compute it, but the brief asks for an
API, and a second client would then copy the rules.

## Decision

- `POST /api/cart/price` takes the raw basket text (`{ basket: string }`)
  and returns the price in integer cents with `currency: "EUR"`. Parsing
  the text is a server concern too.
- The rules live in the `pricing` module of the API: a pure `CartPricing`
  domain service, a `PriceCartUseCase`, and a `CatalogRepository` port
  with an in-memory adapter.
- The screen only collects the basket and shows the answer. It calls the
  client generated from the OpenAPI contract, through a TanStack Query
  mutation with no automatic retry: a retried price is the clerk's choice.

## Consequences

- Seam A (`CartPricing`) covers every rule. Seam B (HTTP) and seam C
  (screen) only check the wiring, so a rule change touches one test file.
- Every price needs a request. The cold start of the demo host is handled
  by the timeout and retry message of #7.
