import { Module } from "@nestjs/common";

import { PriceCartUseCase } from "./application/price-cart.use-case";
import { DISCOUNT_TIERS } from "./domain/discount-tier";
import { InMemoryCatalogRepository } from "./infrastructure/in-memory-catalog.repository";
import { CartPriceController } from "./presentation/cart-price.controller";

@Module({
  controllers: [CartPriceController],
  providers: [
    {
      provide: PriceCartUseCase,
      useFactory: () =>
        new PriceCartUseCase({
          catalog: new InMemoryCatalogRepository(),
          discountTiers: DISCOUNT_TIERS,
        }),
    },
  ],
})
export class PricingModule {}
