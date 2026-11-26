import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./global.css";

import { Anchor, Container, MantineProvider, Text, Title } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { CartPricing } from "./features/cart-pricing/cart-pricing";
import { messages } from "./messages";
import { createQueryClient } from "./query-client";
import { RootErrorBoundary } from "./root-error-boundary";
import { cssVariablesResolver, theme } from "./theme/theme";

const mainContentId = "main-content";

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [basket, setBasket] = useState("");

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        forceColorScheme="light"
      >
        <Notifications />
        <RootErrorBoundary>
          <Anchor href={`#${mainContentId}`} className="skip-link">
            {messages.skipLink}
          </Anchor>
          <Container component="header" size="md" pt="xl">
            <Title order={1}>{messages.app.title}</Title>
            <Text c="dimmed" size="lg" mt="xs">
              {messages.app.tagline}
            </Text>
          </Container>
          <Container
            component="main"
            id={mainContentId}
            tabIndex={-1}
            size="md"
            py="xl"
          >
            <CartPricing basket={basket} onBasketChange={setBasket} />
          </Container>
        </RootErrorBoundary>
      </MantineProvider>
    </QueryClientProvider>
  );
}
