import {
  getDefaultNormalizer,
  render,
  screen,
  waitFor,
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

  function answerPricing(answer: (total: number) => Promise<number>) {
    return (total: number): void => {
      server.use(
        http.post<PathParams, CartPriceControllerPriceData["body"]>(
          cartPriceUrl,
          async ({ request }) => {
            const { basket } = await request.json();
            pricedBaskets.push(basket);
            const price: CartPriceControllerPriceResponse = {
              total: await answer(total),
              currency: "EUR",
            };

            return HttpResponse.json(price);
          },
        ),
      );
    };
  }

  render(<App />);

  return {
    givenTheApiPricesCartsAt: answerPricing(async (total) => total),
    givenTheApiNeverAnswers: answerPricing(() => NEVER),
    pricedBaskets: () => pricedBaskets,
    priceBasket: async (basket: string) => {
      await user.type(basketField(), basket);
      await user.click(calculateButton());
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
  };
}

function basketField(): HTMLElement {
  return screen.getByRole("textbox", {
    name: messages.cartPricing.basketLabel,
  });
}

function calculateButton(): HTMLElement {
  return screen.getByRole("button", { name: messages.cartPricing.calculate });
}
