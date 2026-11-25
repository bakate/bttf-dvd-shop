import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { messages } from "../../messages";
import { createSystemUnderTest } from "../../test/create-system-under-test";
import { EXAMPLE_BASKETS } from "./example-baskets";

const { breakdown } = messages.cartPricing;

describe("Cart pricing screen", () => {
  it("Given the API prices the basket, when the clerk calculates it, then the total is announced in French euros", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiPricesCartsAt(4050);

    await shop.priceBasket(
      "Back to the Future 1\nBack to the Future 1\nBack to the Future 2",
    );

    expect(await shop.announcedResult()).toContain("40,50 €");
    expect(shop.isCalculateBusy()).toBe(false);
  });

  it("Given a basket with blank lines and extra spaces, when the clerk calculates it, then the API receives the basket exactly as typed", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiPricesCartsAt(3500);
    const basket = "  Back to the Future 3\n\nLa chèvre  ";

    await shop.priceBasket(basket);

    await waitFor(() => {
      expect(shop.pricedBaskets()).toEqual([basket]);
    });
  });

  it("Given the API has not answered yet, when the clerk calculates, then the Calculate button is busy", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiNeverAnswers();

    await shop.priceBasket("Back to the Future 1");

    await waitFor(() => {
      expect(shop.isCalculateBusy()).toBe(true);
    });
  });

  it("Given a keyboard user, when they type the basket and press Enter on Calculate, then the total is announced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiPricesCartsAt(2000);

    await shop.priceBasketWithKeyboard("La chèvre");

    expect(await shop.announcedResult()).toContain("20,00 €");
  });

  it("Given the API prices three distinct episodes and a regular movie, when the clerk calculates, then the breakdown table shows every line and how the total is built", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiPricesThreeEpisodesAndARegularMovie();

    await shop.priceBasket(
      "Back to the Future 1\nBack to the Future 2\nBack to the Future 3\nLa chèvre",
    );

    expect(await shop.announcedBreakdown()).toEqual([
      [
        breakdown.title,
        breakdown.kind,
        breakdown.quantity,
        breakdown.unitPrice,
      ],
      ["Back to the Future 1", breakdown.kinds["saga-episode"], "1", "15,00 €"],
      ["Back to the Future 2", breakdown.kinds["saga-episode"], "1", "15,00 €"],
      ["Back to the Future 3", breakdown.kinds["saga-episode"], "1", "15,00 €"],
      ["La chèvre", breakdown.kinds["regular-movie"], "1", "20,00 €"],
      [breakdown.sagaSubtotal, "45,00 €"],
      [breakdown.distinctSagaEpisodeCount, "3"],
      [breakdown.discount("20 %"), "-9,00 €"],
      [breakdown.regularSubtotal, "20,00 €"],
      [breakdown.total, "56,00 €"],
    ]);
  });

  it("Given the API prices one episode bought twice, when the clerk calculates, then the breakdown shows one line of two copies and no discount", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiPricesOneEpisodeTwice();

    await shop.priceBasket("Back to the Future 1\nBack to the Future 1");

    const rows = await shop.announcedBreakdown();
    expect(rows).toContainEqual([
      "Back to the Future 1",
      breakdown.kinds["saga-episode"],
      "2",
      "15,00 €",
    ]);
    expect(rows).toContainEqual([breakdown.noDiscount, "0,00 €"]);
  });

  it.each(
    EXAMPLE_BASKETS.map((basket, index) => ({ number: index + 1, basket })),
  )(
    "Given the brief's example $number, when the reviewer loads it, then the basket field holds that cart",
    async ({ number, basket }) => {
      const shop = createSystemUnderTest();

      await shop.loadExample(number);

      expect(shop.basket()).toBe(basket);
    },
  );

  it("Given a keyboard user, when they tab to the second example and press Enter, then the basket field holds that cart", async () => {
    const shop = createSystemUnderTest();

    await shop.loadExampleWithKeyboard(2);

    expect(shop.basket()).toBe(EXAMPLE_BASKETS[1]);
  });
});
