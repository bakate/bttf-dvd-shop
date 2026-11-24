/** A fraction of the saga subtotal, between 0 and 1 (`0.2` is 20 % off). */
export type DiscountRate = number;

export type DiscountTier = {
  readonly distinctEpisodesThreshold: number;
  readonly rate: DiscountRate;
};

export const DISCOUNT_TIERS = [
  { distinctEpisodesThreshold: 3, rate: 0.2 },
  { distinctEpisodesThreshold: 2, rate: 0.1 },
] as const satisfies readonly DiscountTier[];

export function findApplicableTier({
  discountTiers,
  distinctSagaEpisodeCount,
}: {
  readonly discountTiers: readonly DiscountTier[];
  readonly distinctSagaEpisodeCount: number;
}): DiscountTier | undefined {
  return discountTiers
    .filter(
      (tier) => distinctSagaEpisodeCount >= tier.distinctEpisodesThreshold,
    )
    .toSorted(
      (first, second) =>
        second.distinctEpisodesThreshold - first.distinctEpisodesThreshold,
    )[0];
}
