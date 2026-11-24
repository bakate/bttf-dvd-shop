import type { DiscountRate } from "./discount-tier";

declare const euroCentsBrand: unique symbol;

export type EuroCents = number & { readonly [euroCentsBrand]: true };

export const CURRENCY = "EUR";

function isEuroCents(amount: number): amount is EuroCents {
  return Number.isSafeInteger(amount);
}

export function euroCents(amount: number): EuroCents {
  if (!isEuroCents(amount)) {
    throw new RangeError(`An amount in cents must be an integer: ${amount}.`);
  }

  return amount;
}

export function sumEuroCents(amounts: readonly EuroCents[]): EuroCents {
  return euroCents(amounts.reduce((total, amount) => total + amount, 0));
}

export function subtractEuroCents({
  amount,
  deduction,
}: {
  readonly amount: EuroCents;
  readonly deduction: EuroCents;
}): EuroCents {
  return euroCents(amount - deduction);
}

export function shareOfEuroCents({
  amount,
  rate,
}: {
  readonly amount: EuroCents;
  readonly rate: DiscountRate;
}): EuroCents {
  return euroCents(Math.round(amount * rate));
}
