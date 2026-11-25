import type { SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

import type { DiscountRate } from "../domain/discount-tier";
import { CURRENCY, type EuroCents } from "../domain/euro-cents";
import type { Movie } from "../domain/movie";

export const cartPriceRequestSchema = z.object({
  basket: z.string(),
});

export const apiKindByMovieKind = {
  "saga-episode": "saga-episode",
  "regular-movie": "regular-movie",
} as const satisfies Record<Movie["kind"], string>;

type ApiMovieKind = (typeof apiKindByMovieKind)[Movie["kind"]];

export type CartPriceLine = {
  readonly title: string;
  readonly kind: ApiMovieKind;
  readonly unitPrice: EuroCents;
  readonly quantity: number;
};

export type CartPriceResponse = {
  readonly lines: readonly CartPriceLine[];
  readonly sagaSubtotal: EuroCents;
  readonly distinctSagaEpisodeCount: number;
  readonly discountRate: DiscountRate | null;
  readonly discount: EuroCents;
  readonly regularSubtotal: EuroCents;
  readonly total: EuroCents;
  readonly currency: typeof CURRENCY;
};

export const cartPriceRequestOpenApiSchema = {
  type: "object",
  required: ["basket"],
  properties: {
    basket: {
      type: "string",
      description: "The cart as plain text, one movie title per line.",
      example: "Back to the Future 1\nBack to the Future 2\nLa chèvre",
    },
  },
} as const satisfies SchemaObject;

function amountInCents({
  description,
  example,
}: {
  readonly description: string;
  readonly example: number;
}) {
  return {
    type: "integer",
    minimum: 0,
    description: `${description}, in euro cents.`,
    example,
  } as const satisfies SchemaObject;
}

export const cartPriceResponseOpenApiSchema = {
  type: "object",
  required: [
    "lines",
    "sagaSubtotal",
    "distinctSagaEpisodeCount",
    "discountRate",
    "discount",
    "regularSubtotal",
    "total",
    "currency",
  ],
  properties: {
    lines: {
      type: "array",
      description:
        "One line per title, in the order each title first appears in the basket.",
      items: {
        type: "object",
        required: ["title", "kind", "unitPrice", "quantity"],
        properties: {
          title: {
            type: "string",
            description:
              "The title as first read, with its whitespace collapsed.",
            example: "Back to the Future 1",
          },
          kind: {
            type: "string",
            enum: Object.values(apiKindByMovieKind),
          },
          unitPrice: amountInCents({
            description: "Unit price of the movie",
            example: 1500,
          }),
          quantity: {
            type: "integer",
            minimum: 1,
            description:
              "Copies of the title in the cart, matched ignoring case and whitespace.",
            example: 2,
          },
        },
      },
    },
    sagaSubtotal: amountInCents({
      description: "Saga episodes before discount",
      example: 3000,
    }),
    distinctSagaEpisodeCount: {
      type: "integer",
      minimum: 0,
      description: "Number of different saga episodes in the cart.",
      example: 2,
    },
    discountRate: {
      type: "number",
      minimum: 0,
      maximum: 1,
      nullable: true,
      description:
        "Rate of the discount tier applied to the saga subtotal, or null when the cart reaches no tier.",
      example: 0.1,
    },
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
    currency: { type: "string", enum: [CURRENCY] },
  },
} as const satisfies SchemaObject;
