import { Cart, type EmptyCartError } from "#src/modules/pricing/domain/cart";
import {
  type PriceBreakdown,
  priceCart,
} from "#src/modules/pricing/domain/cart-pricing";
import type { DiscountTier } from "#src/modules/pricing/domain/discount-tier";
import { MovieTitle } from "#src/modules/pricing/domain/movie-title";
import { type Result, success } from "#src/shared/result";
import type { CatalogRepository } from "./catalog-repository";

export type PriceCartError = EmptyCartError;

export class PriceCartUseCase {
  private readonly catalog: CatalogRepository;
  private readonly discountTiers: readonly DiscountTier[];

  constructor({
    catalog,
    discountTiers,
  }: {
    readonly catalog: CatalogRepository;
    readonly discountTiers: readonly DiscountTier[];
  }) {
    this.catalog = catalog;
    this.discountTiers = discountTiers;
  }

  execute(lines: readonly string[]): Result<PriceBreakdown, PriceCartError> {
    const movies = MovieTitle.fromLines(lines).map((title) =>
      this.catalog.findMovie(title),
    );
    const cart = Cart.create(movies);

    if (!cart.success) {
      return cart;
    }

    return success({
      value: priceCart({ cart: cart.value, discountTiers: this.discountTiers }),
    });
  }
}
