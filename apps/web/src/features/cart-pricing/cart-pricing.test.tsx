import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createSystemUnderTest } from "../../test/create-system-under-test";

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
    shop.givenTheApiNeverAnswers(1500);

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
});
