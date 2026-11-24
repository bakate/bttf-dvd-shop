import type { SchemaObject } from "@nestjs/swagger";
import { z } from "zod";

import { CURRENCY, type EuroCents } from "../domain/euro-cents";

export const cartPriceRequestSchema = z.object({
  basket: z.string(),
});

export type CartPriceResponse = {
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

export const cartPriceResponseOpenApiSchema = {
  type: "object",
  required: ["total", "currency"],
  properties: {
    total: {
      type: "integer",
      minimum: 0,
      description: "Total price of the cart, in euro cents.",
      example: 4700,
    },
    currency: { type: "string", enum: [CURRENCY] },
  },
} as const satisfies SchemaObject;
