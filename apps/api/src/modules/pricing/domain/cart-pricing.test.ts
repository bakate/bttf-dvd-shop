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

  it("Given blank lines between titles, when the cart is priced, then the blank lines add nothing", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart(["", "Back to the Future 1", "   ", "\t"]);

    expect(result).toMatchObject({ success: true, value: { total: 1500 } });
  });

  it("Given titles that look like episodes but are not, when the cart is priced, then they are regular movies", () => {
    const { priceCart } = createSystemUnderTest();

    const result = priceCart([
      "Back to the Future 4",
      "Back to the Future",
      "Back to the Future 1",
    ]);

    expect(result).toMatchObject({ success: true, value: { total: 5500 } });
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
