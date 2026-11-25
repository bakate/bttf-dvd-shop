import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { REQUEST_BODY_LIMIT_BYTES } from "../../../app.factory";
import {
  PROBLEM_JSON_MEDIA_TYPE,
  requestProblems,
} from "../../../shared/presentation/problem-details";
import {
  createSystemUnderTest,
  type SystemUnderTest,
} from "../../../test/create-system-under-test";
import { EMPTY_CART_ERROR_CODE } from "../domain/cart";
import { CURRENCY } from "../domain/euro-cents";
import {
  LINE_TOO_LONG_ERROR_CODE,
  MAX_BASKET_LINE_LENGTH,
  MAX_BASKET_LINES,
  TOO_MANY_LINES_ERROR_CODE,
} from "./basket-lines";

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
      mediaType: "application/json",
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
      mediaType: "application/json",
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
      mediaType: "application/json",
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
      mediaType: "application/json",
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

  it("Given a body without a basket, when it is priced, then the API answers an invalid request problem", async () => {
    const reply = await api.priceCart({ cart: "Back to the Future 1" });

    expect(reply).toEqual(
      problemReply({ status: 400, type: requestProblems.invalid.type }),
    );
  });

  it.each([
    { basket: "", description: "an empty basket" },
    { basket: "\n  \n", description: "a basket of blank lines only" },
  ])(
    "Given $description, when it is priced, then the API answers an empty cart problem",
    async ({ basket }) => {
      const reply = await api.priceCart({ basket });

      expect(reply).toEqual(
        problemReply({ status: 400, type: EMPTY_CART_ERROR_CODE }),
      );
    },
  );

  it("Given a basket with one line more than allowed, when it is priced, then the API answers a too many lines problem", async () => {
    const reply = await api.priceCart({
      basket: basketOfLines(Array(MAX_BASKET_LINES + 1).fill("La chèvre")),
    });

    expect(reply).toEqual(
      problemReply({ status: 400, type: TOO_MANY_LINES_ERROR_CODE }),
    );
  });

  it("Given a basket with a line one character longer than allowed, when it is priced, then the API answers a line too long problem", async () => {
    const reply = await api.priceCart({
      basket: basketOfLines([
        "Back to the Future 1",
        "x".repeat(MAX_BASKET_LINE_LENGTH + 1),
      ]),
    });

    expect(reply).toEqual(
      problemReply({ status: 400, type: LINE_TOO_LONG_ERROR_CODE }),
    );
  });

  it("Given a pasted basket with as many titles as allowed, the last one as long as allowed, and trailing blank lines, when it is priced, then the API prices it", async () => {
    const reply = await api.priceCart({
      basket: basketOfLines([
        ...Array(MAX_BASKET_LINES - 1).fill("La chèvre"),
        "x".repeat(MAX_BASKET_LINE_LENGTH),
        "",
        "  ",
      ]),
    });

    expect(reply.statusCode).toBe(200);
  });

  it("Given a body larger than the request limit, when it is priced, then the API answers a request too large problem", async () => {
    const reply = await api.priceCart({
      basket: "x".repeat(REQUEST_BODY_LIMIT_BYTES),
    });

    expect(reply).toEqual(
      problemReply({ status: 413, type: requestProblems.tooLarge.type }),
    );
  });
});

function basketOfLines(lines: readonly string[]): string {
  return lines.join("\n");
}

function problemReply({
  status,
  type,
}: {
  readonly status: number;
  readonly type: string;
}) {
  return {
    statusCode: status,
    mediaType: PROBLEM_JSON_MEDIA_TYPE,
    body: {
      type,
      title: expect.any(String),
      status,
      detail: expect.any(String),
    },
  };
}
