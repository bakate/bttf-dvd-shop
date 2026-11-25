import {
  getDefaultNormalizer,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http, type PathParams } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect } from "vitest";

import { App } from "../app";
import type {
  CartPriceControllerPriceData,
  CartPriceControllerPriceResponse,
} from "../generated/api";
import { messages } from "../messages";

const cartPriceUrl: CartPriceControllerPriceData["url"] = "/api/cart/price";
const NEVER = new Promise<never>(() => {});

const server = setupServer();
const normalizeText = getDefaultNormalizer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

export function createSystemUnderTest() {
  const pricedBaskets: string[] = [];
  const user = userEvent.setup();

  function answerPricing(
    answer: () => Promise<CartPriceControllerPriceResponse>,
  ): void {
    server.use(
      http.post<PathParams, CartPriceControllerPriceData["body"]>(
        cartPriceUrl,
        async ({ request }) => {
          const { basket } = await request.json();
          pricedBaskets.push(basket);

          return HttpResponse.json(await answer());
        },
      ),
    );
  }

  render(<App />);

  return {
    givenTheApiPricesThreeEpisodesAndARegularMovie: () =>
      answerPricing(async () => threeEpisodesAndARegularMovie),
    givenTheApiPricesOneEpisodeTwice: () =>
      answerPricing(async () => oneEpisodeTwice),
    givenTheApiPricesCartsAt: (total: number) =>
      answerPricing(async () => regularMoviesPricedAt(total)),
    givenTheApiNeverAnswers: () => answerPricing(() => NEVER),
    pricedBaskets: () => pricedBaskets,
    priceBasket: async (basket: string) => {
      await user.type(basketField(), basket);
      await user.click(calculateButton());
    },
    loadExample: async (exampleNumber: number) => {
      await user.click(exampleButton(exampleNumber));
    },
    loadExampleWithKeyboard: async (exampleNumber: number) => {
      const example = exampleButton(exampleNumber);
      while (document.activeElement !== example) {
        await user.tab();
      }
      await user.keyboard("{Enter}");
    },
    basket: () => {
      const field = basketField();

      return field instanceof HTMLTextAreaElement ? field.value : undefined;
    },
    priceBasketWithKeyboard: async (basket: string) => {
      await user.tab();
      await user.tab();
      await user.keyboard(basket);
      await user.tab();
      await user.keyboard("{Enter}");
    },
    isCalculateBusy: () =>
      calculateButton().getAttribute("aria-busy") === "true",
    announcedResult: async () => {
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).not.toBe("");
      });

      return normalizeText(screen.getByRole("status").textContent ?? "");
    },
    announcedBreakdown: async () => {
      const table = await within(screen.getByRole("status")).findByRole(
        "table",
        { name: messages.cartPricing.breakdown.caption },
      );

      return within(table)
        .getAllByRole("row")
        .map((row) =>
          row instanceof HTMLTableRowElement
            ? [...row.cells].map((cell) =>
                normalizeText(cell.textContent ?? ""),
              )
            : [],
        );
    },
  };
}

const threeEpisodesAndARegularMovie: CartPriceControllerPriceResponse = {
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
    { title: "La chèvre", kind: "regular-movie", unitPrice: 2000, quantity: 1 },
  ],
  sagaSubtotal: 4500,
  distinctSagaEpisodeCount: 3,
  discountRate: 0.2,
  discount: 900,
  regularSubtotal: 2000,
  total: 5600,
  currency: "EUR",
};

const oneEpisodeTwice: CartPriceControllerPriceResponse = {
  lines: [
    {
      title: "Back to the Future 1",
      kind: "saga-episode",
      unitPrice: 1500,
      quantity: 2,
    },
  ],
  sagaSubtotal: 3000,
  distinctSagaEpisodeCount: 1,
  discountRate: null,
  discount: 0,
  regularSubtotal: 0,
  total: 3000,
  currency: "EUR",
};

function regularMoviesPricedAt(
  total: number,
): CartPriceControllerPriceResponse {
  return {
    lines: [],
    sagaSubtotal: 0,
    distinctSagaEpisodeCount: 0,
    discountRate: null,
    discount: 0,
    regularSubtotal: total,
    total,
    currency: "EUR",
  };
}

function exampleButton(exampleNumber: number): HTMLElement {
  return screen.getByRole("button", {
    name: messages.cartPricing.examples.load(exampleNumber),
  });
}

function basketField(): HTMLElement {
  return screen.getByRole("textbox", {
    name: messages.cartPricing.basketLabel,
  });
}

function calculateButton(): HTMLElement {
  return screen.getByRole("button", { name: messages.cartPricing.calculate });
}
