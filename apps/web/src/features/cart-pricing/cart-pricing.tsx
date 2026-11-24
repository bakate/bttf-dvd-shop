import { Box, Button, Stack, Text, Textarea } from "@mantine/core";
import { type FormEvent, useState } from "react";

import { formatPrice } from "../../format";
import { messages } from "../../messages";
import { usePriceCart } from "./use-price-cart";

const BASKET_ROWS = 8;

export function CartPricing() {
  const [basket, setBasket] = useState("");
  const pricing = usePriceCart();

  function calculate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    pricing.mutate(basket);
  }

  return (
    <Stack gap="lg">
      <form onSubmit={calculate}>
        <Stack gap="md">
          <Textarea
            label={messages.cartPricing.basketLabel}
            description={messages.cartPricing.basketDescription}
            value={basket}
            onChange={(event) => setBasket(event.currentTarget.value)}
            rows={BASKET_ROWS}
          />
          <Box>
            <Button
              type="submit"
              loading={pricing.isPending}
              aria-busy={pricing.isPending}
            >
              {messages.cartPricing.calculate}
            </Button>
          </Box>
        </Stack>
      </form>
      <Box role="status">
        {pricing.data !== undefined && (
          <Stack gap="xs">
            <Text c="dimmed">{messages.cartPricing.totalLabel}</Text>
            <Text ff="heading" fz="h1" fw="bold">
              {formatPrice(pricing.data.total)}
            </Text>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
