import {
  BadRequestException,
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
  ApiTags,
} from "@nestjs/swagger";

import {
  type ApiErrorCode,
  createApiErrorBody,
} from "../../../shared/presentation/api-error";
import {
  type PriceCartError,
  PriceCartUseCase,
} from "../application/price-cart.use-case";
import type { PriceBreakdown } from "../domain/cart-pricing";
import { CURRENCY } from "../domain/euro-cents";
import { splitBasketLines } from "./basket-lines";
import {
  apiKindByMovieKind,
  type CartPriceResponse,
  cartPriceRequestOpenApiSchema,
  cartPriceRequestSchema,
  cartPriceResponseOpenApiSchema,
} from "./cart-price.schemas";
import { CART_CONTROLLER_PATH, CART_PRICE_PATH } from "./cart-routes";

const apiErrorCodeByPriceCartError = {
  "cart/empty": "VALIDATION_FAILED",
} as const satisfies Record<PriceCartError["code"], ApiErrorCode>;

function toCartPriceResponse(breakdown: PriceBreakdown): CartPriceResponse {
  return {
    lines: breakdown.lines.map(({ movie, quantity }) => ({
      title: movie.title.text,
      kind: apiKindByMovieKind[movie.kind],
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
  @ApiBadRequestResponse({ description: "The cart cannot be priced." })
  price(@Body() body: unknown): CartPriceResponse {
    const request = cartPriceRequestSchema.safeParse(body);

    if (!request.success) {
      throw new BadRequestException();
    }

    const result = this.priceCart.execute(
      splitBasketLines(request.data.basket),
    );

    if (!result.success) {
      throw new BadRequestException(
        createApiErrorBody({
          code: apiErrorCodeByPriceCartError[result.error.code],
          message: result.error.message,
        }),
      );
    }

    return toCartPriceResponse(result.value);
  }
}
