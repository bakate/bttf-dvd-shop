import { Box, Button, Group, Stack, Text, Textarea } from "@mantine/core";
import {
  IconCalculator,
  IconClipboardList,
  IconReceiptEuro,
} from "@tabler/icons-react";
import { type FormEvent, useState } from "react";

import { formatPrice } from "../../format";
import { messages } from "../../messages";
import { iconSizes } from "../../theme/theme";
import { EXAMPLE_BASKETS } from "./example-baskets";
import { PriceBreakdown } from "./price-breakdown";
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
          <Group justify="space-between">
            <Button
              type="submit"
              loading={pricing.isPending}
              aria-busy={pricing.isPending}
              leftSection={<IconCalculator size={iconSizes.md} aria-hidden />}
            >
              {messages.cartPricing.calculate}
            </Button>
            <Group
              gap="xs"
              role="group"
              aria-label={messages.cartPricing.examples.label}
            >
              {EXAMPLE_BASKETS.map((exampleBasket, index) => (
                <Button
                  key={exampleBasket}
                  type="button"
                  variant="default"
                  size="xs"
                  leftSection={
                    <IconClipboardList size={iconSizes.sm} aria-hidden />
                  }
                  onClick={() => setBasket(exampleBasket)}
                >
                  {messages.cartPricing.examples.load(index + 1)}
                </Button>
              ))}
            </Group>
          </Group>
        </Stack>
      </form>
      <Box role="status">
        {pricing.data !== undefined && (
          <Stack gap="lg">
            <Stack gap="xs">
              <Group gap="xs" c="dimmed">
                <IconReceiptEuro size={iconSizes.md} aria-hidden />
                <Text>{messages.cartPricing.totalLabel}</Text>
              </Group>
              <Text ff="heading" fz="h1" fw="bold">
                {formatPrice(pricing.data.total)}
              </Text>
            </Stack>
            <PriceBreakdown price={pricing.data} />
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
