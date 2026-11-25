import { PriceCartUseCase } from "#src/modules/pricing/application/price-cart.use-case";
import {
  DISCOUNT_TIERS,
  type DiscountTier,
} from "#src/modules/pricing/domain/discount-tier";
import { InMemoryCatalogRepository } from "#src/modules/pricing/infrastructure/in-memory-catalog.repository";

export function createSystemUnderTest({
  discountTiers = DISCOUNT_TIERS,
}: {
  readonly discountTiers?: readonly DiscountTier[];
} = {}) {
  const priceCart = new PriceCartUseCase({
    catalog: new InMemoryCatalogRepository(),
    discountTiers,
  });

  return {
    priceCart: (titles: readonly string[]) => priceCart.execute(titles),
  };
}
