const locale = "fr-FR";

const priceFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "EUR",
});

const rateFormatter = new Intl.NumberFormat(locale, { style: "percent" });

export function formatPrice(amountInCents: number): string {
  return priceFormatter.format(amountInCents / 100);
}

export function formatRate(rate: number): string {
  return rateFormatter.format(rate);
}
