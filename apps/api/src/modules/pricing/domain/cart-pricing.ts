import type { Cart, CartLine } from "./cart";
import {
  type DiscountRate,
  type DiscountTier,
  findApplicableTier,
} from "./discount-tier";
import {
  type EuroCents,
  euroCents,
  shareOfEuroCents,
  subtractEuroCents,
  sumEuroCents,
} from "./euro-cents";

export type PriceBreakdown = {
  readonly lines: readonly CartLine[];
  readonly sagaSubtotal: EuroCents;
  readonly distinctSagaEpisodeCount: number;
  readonly discountRate: DiscountRate | undefined;
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
  const distinctSagaEpisodeCount = cart.distinctSagaEpisodeCount();
  const tier = findApplicableTier({ discountTiers, distinctSagaEpisodeCount });
  const discount =
    tier === undefined
      ? NO_DISCOUNT
      : shareOfEuroCents({ amount: sagaSubtotal, rate: tier.rate });

  return {
    lines: cart.lines(),
    sagaSubtotal,
    distinctSagaEpisodeCount,
    discountRate: tier?.rate,
    discount,
    regularSubtotal,
    total: sumEuroCents([
      subtractEuroCents({ amount: sagaSubtotal, deduction: discount }),
      regularSubtotal,
    ]),
  };
}
