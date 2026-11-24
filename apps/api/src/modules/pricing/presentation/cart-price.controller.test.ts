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

  it("Given a basket of three distinct episodes and a regular movie, when it is priced, then the API answers the total in euro cents", async () => {
    const reply = await api.priceCart({
      basket:
        "Back to the Future 1\nBack to the Future 2\nBack to the Future 3\nLa chèvre",
    });

    expect(reply).toEqual({
      statusCode: 200,
      body: { total: 5600, currency: CURRENCY },
    });
  });

  it("Given a basket with a single saga episode, when it is priced, then the API answers its full price in euro cents", async () => {
    const reply = await api.priceCart({ basket: "Back to the Future 2" });

    expect(reply).toEqual({
      statusCode: 200,
      body: { total: 1500, currency: CURRENCY },
    });
  });

  it("Given a basket with Windows line endings and blank lines, when it is priced, then each non-blank line is one movie", async () => {
    const reply = await api.priceCart({
      basket:
        "Back to the Future 1\r\n\r\nBack to the Future 1\r\nBack to the Future 2\r\n",
    });

    expect(reply).toEqual({
      statusCode: 200,
      body: { total: 4050, currency: CURRENCY },
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
