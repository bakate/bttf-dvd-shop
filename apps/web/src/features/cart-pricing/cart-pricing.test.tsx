import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { messages } from "../../messages";
import { createSystemUnderTest } from "../../test/create-system-under-test";
import { EXAMPLE_BASKETS } from "./example-baskets";

const { breakdown, errors } = messages.cartPricing;
const { serviceNotResponding } = errors;
const emptyCart = "cart/empty" satisfies keyof typeof errors.byProblemType;

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

  it("Given the API has not priced the basket yet, when the clerk loads an example, then the basket field still holds the basket being priced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiNeverAnswers();
    await shop.priceBasket("La chèvre");

    await shop.loadExample(1);

    expect(shop.basket()).toBe("La chèvre");
  });

  it("Given a keyboard user, when they tab to the second example and press Enter, then the basket field holds that cart", async () => {
    const shop = createSystemUnderTest();

    await shop.loadExampleWithKeyboard(2);

    expect(shop.basket()).toBe(EXAMPLE_BASKETS[1]);
  });

  it.each(
    Object.entries(errors.byProblemType).map(([type, message]) => ({
      type,
      message,
    })),
  )(
    "Given the API rejects the cart with $type, when the clerk calculates, then its French message is announced in a notification",
    async ({ type, message }) => {
      const shop = createSystemUnderTest();
      shop.givenTheApiRejectsTheCartWith(type);

      await shop.priceBasket("Back to the Future 1");

      expect(await shop.announcedError()).toContain(message);
    },
  );

  it("Given the API rejects the cart with a code the screen does not know, when the clerk calculates, then the generic message is announced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiRejectsTheCartWith("cart/unknown");

    await shop.priceBasket("Back to the Future 1");

    expect(await shop.announcedError()).toContain(errors.fallback);
  });

  it("Given an empty basket field, when the clerk calculates, then the API's empty cart message is announced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiRejectsTheCartWith(emptyCart);

    await shop.calculate();

    expect(await shop.announcedError()).toContain(
      errors.byProblemType[emptyCart],
    );
  });

  it.each([
    {
      failure: "fails with a server error",
      given: "givenTheApiFailsWithAServerError",
    },
    { failure: "is unreachable", given: "givenTheApiIsUnreachable" },
  ] as const)(
    "Given the API $failure, when the clerk calculates, then an unexpected error notification is announced",
    async ({ given }) => {
      const shop = createSystemUnderTest();
      shop[given]();

      await shop.priceBasket("Back to the Future 1");

      expect(await shop.announcedError()).toContain(
        messages.errors.unexpected.message,
      );
    },
  );

  it("Given the API rejects the cart, when the clerk calculates, then only the cart's own message is announced, with no unexpected error notification", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiRejectsTheCartWith(emptyCart);

    await shop.calculate();

    expect(await shop.announcedErrors()).toEqual([
      expect.stringContaining(errors.byProblemType[emptyCart]),
    ]);
  });

  it("Given the API stays silent past the request timeout, when the clerk calculates, then only the service not responding message is announced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiStaysSilentPastTheTimeout();
    await shop.priceBasket("Back to the Future 1");

    await shop.waitOutTheRequestTimeout();

    expect(await shop.announcedErrors()).toEqual([
      expect.stringContaining(serviceNotResponding.message),
    ]);
    expect(shop.isCalculateBusy()).toBe(false);
  });

  it("Given the service did not respond and has now started, when the clerk retries, then the same basket is priced and its total announced", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiStaysSilentPastTheTimeout();
    await shop.priceBasket("Back to the Future 1");
    await shop.waitOutTheRequestTimeout();
    shop.givenTheApiPricesCartsAt(1500);

    await shop.retry();

    expect(await shop.announcedResult()).toContain("15,00 €");
    expect(shop.pricedBaskets()).toEqual([
      "Back to the Future 1",
      "Back to the Future 1",
    ]);
  });

  it("Given the API answers a price the screen cannot show, when the clerk calculates, then the fallback screen replaces the blank page", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiAnswersAPriceTheScreenCannotShow();

    await shop.priceBasket("Back to the Future 1");

    expect(await shop.shownFallbackScreen()).toContain(
      messages.errors.fallbackScreen.message,
    );
  });

  it("Given the fallback screen is shown, when the clerk resets it, then the cart form is back with the basket typed before", async () => {
    const shop = createSystemUnderTest();
    shop.givenTheApiAnswersAPriceTheScreenCannotShow();
    await shop.priceBasket("Back to the Future 1");
    await shop.shownFallbackScreen();

    await shop.resetFallbackScreen();

    expect(shop.basket()).toBe("Back to the Future 1");
  });
});
