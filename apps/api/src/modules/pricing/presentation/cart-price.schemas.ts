import type { SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

import { CURRENCY } from "#src/modules/pricing/domain/euro-cents";
import { MOVIE_KINDS } from "#src/modules/pricing/domain/movie";

export const cartPriceRequestSchema = z.object({
  basket: z.string().meta({
    description: "The cart as plain text, one movie title per line.",
    example: "Back to the Future 1\nBack to the Future 2\nLa chèvre",
  }),
});

function amountInCents({
  description,
  example,
}: {
  readonly description: string;
  readonly example: number;
}) {
  return z
    .int()
    .nonnegative()
    .meta({
      description: `${description}, in euro cents.`,
      example,
    });
}

const cartPriceLineSchema = z.object({
  title: z.string().meta({
    description: "The title as first read, with its whitespace collapsed.",
    example: "Back to the Future 1",
  }),
  kind: z.enum(MOVIE_KINDS),
  unitPrice: amountInCents({
    description: "Unit price of the movie",
    example: 1500,
  }),
  quantity: z.int().min(1).meta({
    description:
      "Copies of the title in the cart, matched ignoring case and whitespace.",
    example: 2,
  }),
});

export const cartPriceResponseSchema = z.object({
  lines: z.array(cartPriceLineSchema).meta({
    description:
      "One line per title, in the order each title first appears in the basket.",
  }),
  sagaSubtotal: amountInCents({
    description: "Saga episodes before discount",
    example: 3000,
  }),
  distinctSagaEpisodeCount: z.int().nonnegative().meta({
    description: "Number of different saga episodes in the cart.",
    example: 2,
  }),
  discountRate: z.number().min(0).max(1).nullable().meta({
    description:
      "Rate of the discount tier applied to the saga subtotal, or null when the cart reaches no tier.",
    example: 0.1,
  }),
  discount: amountInCents({
    description: "Discount taken off the saga subtotal",
    example: 300,
  }),
  regularSubtotal: amountInCents({
    description: "Regular movies, never discounted",
    example: 2000,
  }),
  total: amountInCents({
    description: "Total price of the cart",
    example: 4700,
  }),
  currency: z.literal(CURRENCY),
});

export type CartPriceResponse = z.infer<typeof cartPriceResponseSchema>;

// @nestjs/swagger types OpenAPI 3.0 more narrowly than Zod's JSON Schema; the openapi-3.0 target emits a document it accepts (ADR 0016).
function toOpenApiSchema(schema: z.ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: "openapi-3.0",
    io: "input",
  }) as SchemaObject;
}

export const cartPriceRequestOpenApiSchema = toOpenApiSchema(
  cartPriceRequestSchema,
);

export const cartPriceResponseOpenApiSchema = toOpenApiSchema(
  cartPriceResponseSchema,
);
