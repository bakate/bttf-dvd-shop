import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";
import "./global.css";

import { Anchor, Container, MantineProvider, Title } from "@mantine/core";

import { messages } from "./messages";
import { cssVariablesResolver, theme } from "./theme/theme";

const mainContentId = "main-content";

export function App() {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="light"
    >
      <Anchor href={`#${mainContentId}`} className="skip-link">
        {messages.skipLink}
      </Anchor>
      <Container component="header" size="md" pt="xl">
        <Title order={1}>{messages.app.title}</Title>
      </Container>
      <Container
        component="main"
        id={mainContentId}
        tabIndex={-1}
        size="md"
        py="xl"
      />
    </MantineProvider>
  );
}
