import { describe, expect, it } from "vitest";

import { createSystemUnderTest } from "#src/modules/pricing/test/create-system-under-test";
import { EMPTY_CART_ERROR_CODE } from "./cart";

describe("Pricing module: price a cart from its lines", () => {
  it.each([
    {
      cart: "three distinct episodes",
      titles: [
        "Back to the Future 1",
        "Back to the Future 2",
        "Back to the Future 3",
      ],
      total: 3600,
    },
    {
      cart: "two distinct episodes",
      titles: ["Back to the Future 1", "Back to the Future 3"],
      total: 2700,
    },
    {
      cart: "a single episode",
      titles: ["Back to the Future 1"],
      total: 1500,
    },
    {
      cart: "three distinct episodes and a duplicate",
      titles: [
        "Back to the Future 1",
        "Back to the Future 2",
        "Back to the Future 3",
        "Back to the Future 2",
      ],
      total: 4800,
    },
    {
      cart: "three distinct episodes and a regular movie",
      titles: [
        "Back to the Future 1",
        "Back to the Future 2",
        "Back to the Future 3",
        "La chèvre",
      ],
      total: 5600,
    },
    {
      cart: "two distinct episodes, one of them twice",
      titles: [
        "Back to the Future 1",
        "Back to the Future 1",
        "Back to the Future 2",
      ],
      total: 4050,
    },
  ])(
    "Given a cart with $cart, when it is priced, then the total is $total cents",
    ({ titles, total }) => {
      const { priceCart } = createSystemUnderTest();

      const result = priceCart(titles);

      expect(result).toMatchObject({ success: true, value: { total } });
    },
  );

  it("Given titles in another case with extra whitespace, when the cart is priced, then they count as saga episodes", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart([
      "back to the FUTURE 1",
      "  Back  to the\tFuture 2 ",
    ]);

    expect(result).toMatchObject({ success: true, value: { total: 2700 } });
  });

  it.each([
    { title: "Back to the Future 1", episodeNumber: 1 },
    { title: "Back to the Future", episodeNumber: 1 },
    { title: "Retour vers le futur 1", episodeNumber: 1 },
    { title: "Retour vers le futur", episodeNumber: 1 },
    { title: "Back to the Future 2", episodeNumber: 2 },
    { title: "Back to the Future Part II", episodeNumber: 2 },
    { title: "Retour vers le futur 2", episodeNumber: 2 },
    { title: "Retour vers le futur II", episodeNumber: 2 },
    { title: "Back to the Future 3", episodeNumber: 3 },
    { title: "Back to the Future Part III", episodeNumber: 3 },
    { title: "Retour vers le futur 3", episodeNumber: 3 },
    { title: "Retour vers le futur III", episodeNumber: 3 },
  ])(
    "Given $title next to Back to the Future $episodeNumber, when the cart is priced, then both are the same saga episode",
    ({ title, episodeNumber }) => {
      const { priceCart } = createSystemUnderTest();

      const result = priceCart([title, `Back to the Future ${episodeNumber}`]);

      expect(result).toMatchObject({
        success: true,
        value: { distinctSagaEpisodeCount: 1, total: 3000 },
      });
    },
  );

  it("Given the three episodes under French and English titles, when the cart is priced, then the 20 % tier applies", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart([
      "Retour vers le futur",
      "Back to the Future 2",
      "Retour vers le futur III",
    ]);

    expect(result).toMatchObject({
      success: true,
      value: { discountRate: 0.2, total: 3600 },
    });
  });

  it.each([
    "Retour vers le Future 1",
    "BTTF",
    "Retour vers le futur 4",
    "Back to the Future Part 2",
  ])(
    "Given %s, a near miss of a saga title, when the cart is priced, then it is a regular movie",
    (title) => {
      const { priceCart } = createSystemUnderTest();

      const result = priceCart([title]);

      expect(result).toMatchObject({
        success: true,
        value: { regularSubtotal: 2000, total: 2000 },
      });
    },
  );

  it("Given blank lines between titles, when the cart is priced, then the blank lines add nothing", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart(["", "Back to the Future 1", "   ", "\t"]);

    expect(result).toMatchObject({ success: true, value: { total: 1500 } });
  });

  it("Given Back to the Future 4 and episode 1 under its unnumbered and numbered titles, when the cart is priced, then Back to the Future 4 is the only regular movie", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart([
      "Back to the Future 4",
      "Back to the Future",
      "Back to the Future 1",
    ]);

    expect(result).toMatchObject({ success: true, value: { total: 5000 } });
  });

  it("Given only regular movies, when the cart is priced, then each costs 2000 cents without discount", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart([
      "La chèvre",
      "Les visiteurs",
      "Le dîner de cons",
    ]);

    expect(result).toMatchObject({ success: true, value: { total: 6000 } });
  });

  it("Given a discount tier whose amount falls between two cents, when the cart is priced, then the discount is rounded to the nearest cent", () => {
    const { priceCart } = createSystemUnderTest({
      discountTiers: [{ distinctEpisodesThreshold: 1, rate: 0.125 }],
    });

    const result = priceCart(["Back to the Future 1"]);

    expect(result).toMatchObject({ success: true, value: { total: 1312 } });
  });

  it("Given a discount tier whose rate is not a number, when the cart is priced, then pricing fails instead of returning a non-integer amount", () => {
    const { priceCart } = createSystemUnderTest({
      discountTiers: [{ distinctEpisodesThreshold: 1, rate: Number.NaN }],
    });

    const pricing = () => priceCart(["Back to the Future 1"]);

    expect(pricing).toThrow(RangeError);
  });

  it("Given only blank lines, when the cart is priced, then it is rejected as empty", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart(["", "  "]);

    expect(result).toMatchObject({
      success: false,
      error: { code: EMPTY_CART_ERROR_CODE },
    });
  });
});
