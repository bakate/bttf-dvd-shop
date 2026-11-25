import type { Page } from "@playwright/test";

import { messages } from "../src/messages";

export async function createSystemUnderTest(page: Page) {
  await page.goto("/");

  const result = page.getByRole("status");
  const breakdownTable = result.getByRole("table", {
    name: messages.cartPricing.breakdown.caption,
  });

  return {
    priceExample: async (exampleNumber: number) => {
      await page
        .getByRole("button", {
          name: messages.cartPricing.examples.load(exampleNumber),
        })
        .click();
      await page
        .getByRole("button", { name: messages.cartPricing.calculate })
        .click();
    },
    skipToMainContentWithKeyboard: async () => {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
    },
    mainContent: () => page.getByRole("main"),
    announcedTotal: async () => {
      await breakdownTable.waitFor();
      // biome-ignore lint/performance/useDomNodeTextContent: only the rendered line breaks separate the total's label from its amount.
      const [label, amount] = (await result.innerText()).split(/\n+/);

      return { label, amount };
    },
    announcedBreakdown: async () => {
      await breakdownTable.waitFor();

      return breakdownTable
        .getByRole("row")
        .evaluateAll((rows) =>
          rows.map((row) =>
            row instanceof HTMLTableRowElement
              ? [...row.cells].map((cell) => cell.textContent.trim())
              : [],
          ),
        );
    },
  };
}
