import type { Cart } from "./cart";
import { type DiscountTier, findApplicableTier } from "./discount-tier";
import {
  type EuroCents,
  euroCents,
  shareOfEuroCents,
  subtractEuroCents,
  sumEuroCents,
} from "./euro-cents";

export type PriceBreakdown = {
  readonly sagaSubtotal: EuroCents;
  readonly discount: EuroCents;
  readonly regularSubtotal: EuroCents;
  readonly total: EuroCents;
};

const NO_DISCOUNT = euroCents(0);

export function priceCart({
  cart,
  discountTiers,
}: {
  readonly cart: Cart;
  readonly discountTiers: readonly DiscountTier[];
}): PriceBreakdown {
  const sagaSubtotal = cart.sagaSubtotal();
  const regularSubtotal = cart.regularSubtotal();
  const tier = findApplicableTier({
    discountTiers,
    distinctSagaEpisodeCount: cart.distinctSagaEpisodeCount(),
  });
  const discount =
    tier === undefined
      ? NO_DISCOUNT
      : shareOfEuroCents({ amount: sagaSubtotal, rate: tier.rate });

  return {
    sagaSubtotal,
    discount,
    regularSubtotal,
    total: sumEuroCents([
      subtractEuroCents({ amount: sagaSubtotal, deduction: discount }),
      regularSubtotal,
    ]),
  };
}
