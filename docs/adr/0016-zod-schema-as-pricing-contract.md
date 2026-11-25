# 16. One Zod schema per message is the pricing contract

- Status: accepted
- Date: 2026-11-25
- Issue: #17 (parent #1)

## Context

The `POST /api/cart/price` contract was written several times by hand: a
TypeScript type, an OpenAPI object with its `required` list, and an
identity map of movie kinds. Adding `quantity` in #5 meant editing every
copy.

## Decision

- `cart-price.schemas.ts` holds one Zod schema for the request and one for
  the response. `CartPriceResponse` is the response's `z.infer` type, the
  controller reads the request through the type `safeParse` infers, and
  the OpenAPI document is generated from them with
  `z.toJSONSchema(…, { target: "openapi-3.0" })`. Descriptions and
  examples live in `.meta()`.
- The movie kinds are the domain constant `MOVIE_KINDS`. The `Movie`
  types and the response enum both derive from it.
- Both messages are documented as Zod's `input`. The request strips
  unknown keys, so it accepts them. The response is never parsed, so the
  document promises no `additionalProperties: false` the code does not
  check.
- The response is typed against its schema, not parsed: the API produces
  it.
- Zod's JSON Schema type is wider than `@nestjs/swagger`'s `SchemaObject`
  (`type` may be a list, `exclusiveMinimum` a number), so handing the
  generated schema to Swagger takes one `as SchemaObject` cast, in
  `cart-price.schemas.ts`. This is an accepted exception to "no `as`
  cast" (`CODING_STANDARDS.md`). A cast-free adapter was written and
  dropped: about 70 lines of keyword-by-keyword checks, for one contract.

## Consequences

- A new response field is one edit in the schema plus
  `pnpm generate:api`.
- The document gains `maximum: 9007199254740991` on integers (Zod's
  `z.int()` is a safe integer, the same invariant as `EuroCents`). Key
  order changes. The frontend types are unchanged.
- The inferred response type is not `readonly`: Zod's `.readonly()` also
  writes `readOnly: true` into the document, and the generated frontend
  types then mark the status code key `readonly`. The type is only built
  once, by the controller's mapping.
- The cast is checked where it matters: an HTTP contract scenario reads
  the served document and checks the promises clients rely on (integer
  cents, `quantity` at least 1, a nullable `discountRate`).
  `check:api-contract` only catches a committed document that drifts from
  the code, not a changed shape committed with it.
