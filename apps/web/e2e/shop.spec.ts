import { expect, test } from "@playwright/test";

import { EXAMPLE_CARTS } from "../src/features/cart-pricing/example-baskets";
import { formatPrice, formatRate } from "../src/format";
import { messages } from "../src/messages";
import { createSystemUnderTest } from "./create-system-under-test";

const { breakdown } = messages.cartPricing;
const [episode1, episode2, episode3, regularMovie] = EXAMPLE_CARTS[4];

test("Given the shop is open, when the clerk prices the brief's fifth example, then the total and the breakdown match the brief", async ({
  page,
}) => {
  const shop = await createSystemUnderTest(page);

  await shop.priceExample(5);

  expect(await shop.announcedTotal()).toEqual({
    label: messages.cartPricing.totalLabel,
    amount: formatPrice(5600),
  });
  expect(await shop.announcedBreakdown()).toEqual([
    [breakdown.title, breakdown.kind, breakdown.quantity, breakdown.unitPrice],
    [episode1, breakdown.kinds["saga-episode"], "1", formatPrice(1500)],
    [episode2, breakdown.kinds["saga-episode"], "1", formatPrice(1500)],
    [episode3, breakdown.kinds["saga-episode"], "1", formatPrice(1500)],
    [regularMovie, breakdown.kinds["regular-movie"], "1", formatPrice(2000)],
    [breakdown.sagaSubtotal, formatPrice(4500)],
    [breakdown.distinctSagaEpisodeCount, "3"],
    [breakdown.discount(formatRate(0.2)), formatPrice(-900)],
    [breakdown.regularSubtotal, formatPrice(2000)],
    [breakdown.total, formatPrice(5600)],
  ]);
});

test("Given the shop is open, when a keyboard user presses Tab then Enter on the skip link, then focus is on the main content", async ({
  page,
}) => {
  const shop = await createSystemUnderTest(page);

  await shop.skipToMainContentWithKeyboard();

  await expect(shop.mainContent()).toBeFocused();
});
