import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createSystemUnderTest,
  type SystemUnderTest,
} from "../../../test/create-system-under-test";
import { CURRENCY } from "../domain/euro-cents";

describe("POST /api/cart/price", () => {
  let api: SystemUnderTest;

  beforeAll(async () => {
    api = await createSystemUnderTest();
  });

  afterAll(async () => {
    await api.close();
  });

  it("Given a basket of three distinct episodes and a regular movie, when it is priced, then the API answers every line and how the 20 % discount builds the total", async () => {
    const reply = await api.priceCart({
      basket:
        "Back to the Future 1\nBack to the Future 2\nBack to the Future 3\nLa chèvre",
    });

    expect(reply).toEqual({
      statusCode: 200,
      body: {
        lines: [
          {
            title: "Back to the Future 1",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 1,
          },
          {
            title: "Back to the Future 2",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 1,
          },
          {
            title: "Back to the Future 3",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 1,
          },
          {
            title: "La chèvre",
            kind: "regular-movie",
            unitPrice: 2000,
            quantity: 1,
          },
        ],
        sagaSubtotal: 4500,
        distinctSagaEpisodeCount: 3,
        discountRate: 0.2,
        discount: 900,
        regularSubtotal: 2000,
        total: 5600,
        currency: CURRENCY,
      },
    });
  });

  it("Given a basket with a single saga episode, when it is priced, then the API answers its full price with no discount tier", async () => {
    const reply = await api.priceCart({ basket: "Back to the Future 2" });

    expect(reply).toEqual({
      statusCode: 200,
      body: {
        lines: [
          {
            title: "Back to the Future 2",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 1,
          },
        ],
        sagaSubtotal: 1500,
        distinctSagaEpisodeCount: 1,
        discountRate: null,
        discount: 0,
        regularSubtotal: 0,
        total: 1500,
        currency: CURRENCY,
      },
    });
  });

  it("Given a basket with Windows line endings, blank lines and a duplicate episode, when it is priced, then the duplicate is one line of two copies and the 10 % discount covers both", async () => {
    const reply = await api.priceCart({
      basket:
        "Back to the Future 1\r\n\r\nBack to the Future 1\r\nBack to the Future 2\r\n",
    });

    expect(reply).toEqual({
      statusCode: 200,
      body: {
        lines: [
          {
            title: "Back to the Future 1",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 2,
          },
          {
            title: "Back to the Future 2",
            kind: "saga-episode",
            unitPrice: 1500,
            quantity: 1,
          },
        ],
        sagaSubtotal: 4500,
        distinctSagaEpisodeCount: 2,
        discountRate: 0.1,
        discount: 450,
        regularSubtotal: 0,
        total: 4050,
        currency: CURRENCY,
      },
    });
  });

  it("Given the same regular movie typed in two cases, when it is priced, then it is one line of two copies under the title first typed", async () => {
    const reply = await api.priceCart({ basket: "La chèvre\nLA  CHÈVRE" });

    expect(reply).toMatchObject({
      statusCode: 200,
      body: {
        lines: [
          {
            title: "La chèvre",
            kind: "regular-movie",
            unitPrice: 2000,
            quantity: 2,
          },
        ],
        regularSubtotal: 4000,
      },
    });
  });

  it("Given a body without a basket, when it is priced, then the API rejects the request", async () => {
    const reply = await api.priceCart({ cart: "Back to the Future 1" });

    expect(reply.statusCode).toBe(400);
  });

  it("Given a basket of blank lines only, when it is priced, then the API rejects the request", async () => {
    const reply = await api.priceCart({ basket: "\n  \n" });

    expect(reply.statusCode).toBe(400);
  });
});
