# 12. Invalid carts are RFC 9457 problem details

- Status: accepted
- Date: 2026-11-25
- Issue: #6 (parent #1)

## Context

A clerk must know why a cart was not priced, in French. The API must not
leak French text or internals, must stay small under abuse, and must give
a client a code it can match on for good.

## Decision

- Every error response is `application/problem+json` (RFC 9457) with
  `type`, `title`, `status` and `detail`. The global filter writes them
  all, so 404, 429 and 500 share the shape of the cart errors.
- `type` is a stable relative code: `cart/empty`, `cart/too-many-lines`,
  `cart/line-too-long` and `request/invalid` (400), `request/too-large`
  (413). `title` and `detail` are English, for debugging. A published
  code never changes.
- The limits are at most 500 filled lines and 200 characters per line,
  checked with Zod by the input adapter `readBasketLines`, which returns a
  typed `Result`. Blank lines are separators and do not count, so a pasted
  list ending with line breaks is not rejected. The limits guard the input
  format, not a pricing rule, so they live with line splitting rather than
  in the domain (a change from #1, which listed them as domain errors).
  `cart/empty` stays the domain's `EmptyCartError` (ADR 0008).
- The request body is limited to 16 KB, and JSON is the only body parser.
  An oversized body is a 413, not a 400: HTTP has a status for it, and
  body-parser rejects it before any pricing code runs. A parser error's
  message can quote the body, so its `detail` is the problem's title.
- The controller maps each failure to its problem in one lookup table:
  the presentation layer is the only one that knows HTTP.
- The OpenAPI document describes both problem responses, so the generated
  types carry the code union. The screen's French messages are typed
  against it: a new code fails the frontend build until it has a message.
  An unknown code shows a generic message.
- The message is a Mantine notification (`role="alert"`, so it is
  announced), not a field error, at the product owner's request. Calculate
  stays enabled on an empty basket: the click asks the API, which answers
  `cart/empty`, so the rule stays server-side (ADR 0006). This replaces
  #6's "disabled while the cart is empty" and "renders inline".

## Consequences

- The French messages do not quote the limits: the numbers live once, in
  the API. Putting them in the problem as extension members would let the
  screen show them.
- A request that is not JSON reaches the controller with no body and is a
  `request/invalid`.
- Until #7 adds its retry and timeout messages, any failed pricing call
  shows a notification, the generic one for a 5xx or a network error.
- This ticket tests two seams, B and C, because its criteria require both,
  as in ADR 0010.
