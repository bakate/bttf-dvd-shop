import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  PROBLEM_JSON_MEDIA_TYPE,
  ProblemDetailsException,
  problemDetailsOpenApiSchema,
  requestProblems,
} from "../../../shared/presentation/problem-details";
import {
  type PriceCartError,
  PriceCartUseCase,
} from "../application/price-cart.use-case";
import type { PriceBreakdown } from "../domain/cart-pricing";
import { CURRENCY } from "../domain/euro-cents";
import { type BasketError, readBasketLines } from "./basket-lines";
import {
  type CartPriceResponse,
  cartPriceRequestOpenApiSchema,
  cartPriceRequestSchema,
  cartPriceResponseOpenApiSchema,
} from "./cart-price.schemas";
import { CART_CONTROLLER_PATH, CART_PRICE_PATH } from "./cart-routes";

type CartError = BasketError | PriceCartError;

// RFC 9457: clients match on `type`, so a published cart error code never changes.
const problemTitleByCartError = {
  "cart/empty": "The cart has no movie.",
  "cart/too-many-lines": "The basket has too many lines.",
  "cart/line-too-long": "A basket line is too long.",
} as const satisfies Record<CartError["code"], string>;

function toCartProblem(error: CartError): ProblemDetailsException {
  return new ProblemDetailsException({
    type: error.code,
    title: problemTitleByCartError[error.code],
    status: HttpStatus.BAD_REQUEST,
    detail: error.message,
  });
}

function problemResponse(schema: object) {
  return { content: { [PROBLEM_JSON_MEDIA_TYPE]: { schema } } };
}

function toCartPriceResponse(breakdown: PriceBreakdown): CartPriceResponse {
  return {
    lines: breakdown.lines.map(({ movie, quantity }) => ({
      title: movie.title.text,
      kind: movie.kind,
      unitPrice: movie.unitPrice,
      quantity,
    })),
    sagaSubtotal: breakdown.sagaSubtotal,
    distinctSagaEpisodeCount: breakdown.distinctSagaEpisodeCount,
    discountRate: breakdown.discountRate ?? null,
    discount: breakdown.discount,
    regularSubtotal: breakdown.regularSubtotal,
    total: breakdown.total,
    currency: CURRENCY,
  };
}

@ApiTags("Cart")
@Controller(CART_CONTROLLER_PATH)
export class CartPriceController {
  constructor(
    @Inject(PriceCartUseCase) private readonly priceCart: PriceCartUseCase,
  ) {}

  @Post(CART_PRICE_PATH)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Price a cart" })
  @ApiBody({ schema: cartPriceRequestOpenApiSchema })
  @ApiOkResponse({
    description: "The cart price.",
    schema: cartPriceResponseOpenApiSchema,
  })
  @ApiBadRequestResponse({
    description: "The request or the cart cannot be priced.",
    ...problemResponse(
      problemDetailsOpenApiSchema({
        types: [
          ...Object.keys(problemTitleByCartError),
          requestProblems.invalid.type,
        ],
        status: HttpStatus.BAD_REQUEST,
      }),
    ),
  })
  @ApiPayloadTooLargeResponse({
    description: "The request body is too large.",
    ...problemResponse(
      problemDetailsOpenApiSchema({
        types: [requestProblems.tooLarge.type],
        status: HttpStatus.PAYLOAD_TOO_LARGE,
      }),
    ),
  })
  price(@Body() body: unknown): CartPriceResponse {
    const request = cartPriceRequestSchema.safeParse(body);

    if (!request.success) {
      throw new ProblemDetailsException({
        ...requestProblems.invalid,
        status: HttpStatus.BAD_REQUEST,
        detail: "The body must be a JSON object with a string basket.",
      });
    }

    const lines = readBasketLines(request.data.basket);

    if (!lines.success) {
      throw toCartProblem(lines.error);
    }

    const result = this.priceCart.execute(lines.value);

    if (!result.success) {
      throw toCartProblem(result.error);
    }

    return toCartPriceResponse(result.value);
  }
}
