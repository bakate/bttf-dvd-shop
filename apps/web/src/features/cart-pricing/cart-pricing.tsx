import {
  Alert,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import {
  IconCalculator,
  IconClipboardList,
  IconClockExclamation,
  IconReceiptEuro,
  IconRefresh,
} from "@tabler/icons-react";
import type { FormEvent } from "react";

import { classifyRequestError } from "../../api-client";
import { formatPrice } from "../../format";
import { messages } from "../../messages";
import { notifyError } from "../../notify-error";
import { iconSizes } from "../../theme/theme";
import { cartErrorMessage } from "./cart-error-message";
import { EXAMPLE_BASKETS } from "./example-baskets";
import { PriceBreakdown } from "./price-breakdown";
import { usePriceCart } from "./use-price-cart";

const BASKET_MIN_ROWS = 8;
const BASKET_MAX_ROWS = 16;

const { serviceNotResponding } = messages.cartPricing.errors;

function notifyCartProblem(error: unknown): void {
  const failure = classifyRequestError(error);

  if (failure.kind !== "client-problem") {
    return;
  }

  notifyError({
    title: messages.cartPricing.errors.title,
    message: cartErrorMessage(failure.problem),
  });
}

export function CartPricing({
  basket,
  onBasketChange,
}: {
  readonly basket: string;
  readonly onBasketChange: (basket: string) => void;
}) {
  const pricing = usePriceCart();
  const isServiceNotResponding =
    pricing.isError && classifyRequestError(pricing.error).kind === "timeout";

  function price(basketToPrice: string): void {
    pricing.mutate(basketToPrice, { onError: notifyCartProblem });
  }

  function calculate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    price(basket);
  }

  return (
    <Stack gap="lg">
      <form onSubmit={calculate}>
        <Stack gap="md">
          <Textarea
            label={messages.cartPricing.basketLabel}
            description={messages.cartPricing.basketDescription}
            value={basket}
            onChange={(event) => onBasketChange(event.currentTarget.value)}
            autosize
            minRows={BASKET_MIN_ROWS}
            maxRows={BASKET_MAX_ROWS}
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
                  onClick={() => onBasketChange(exampleBasket)}
                >
                  {messages.cartPricing.examples.load(index + 1)}
                </Button>
              ))}
            </Group>
          </Group>
        </Stack>
      </form>
      {isServiceNotResponding ? (
        <Alert
          color="caution"
          icon={<IconClockExclamation size={iconSizes.md} aria-hidden />}
          title={serviceNotResponding.title}
        >
          <Stack gap="sm" align="flex-start">
            <Text>{serviceNotResponding.message}</Text>
            <Button
              variant="default"
              leftSection={<IconRefresh size={iconSizes.md} aria-hidden />}
              onClick={() => price(pricing.variables)}
            >
              {serviceNotResponding.retry}
            </Button>
          </Stack>
        </Alert>
      ) : null}
      <Box role="status">
        {pricing.data === undefined ? null : (
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
