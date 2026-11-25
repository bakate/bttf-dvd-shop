import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { Component, type ReactNode } from "react";

import { messages } from "./messages";
import { iconSizes } from "./theme/theme";

type RootErrorBoundaryProps = {
  readonly children: ReactNode;
};

type RootErrorBoundaryState = {
  readonly hasFailed: boolean;
};

const { fallbackScreen } = messages.errors;

export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  override state: RootErrorBoundaryState = { hasFailed: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasFailed: true };
  }

  override render(): ReactNode {
    if (!this.state.hasFailed) {
      return this.props.children;
    }

    return (
      <Container component="main" size="md" py="xl">
        <Stack gap="md" align="flex-start">
          <Title order={1}>{fallbackScreen.title}</Title>
          <Text>{fallbackScreen.message}</Text>
          <Button
            leftSection={<IconRefresh size={iconSizes.md} aria-hidden />}
            onClick={() => this.setState({ hasFailed: false })}
          >
            {fallbackScreen.reset}
          </Button>
        </Stack>
      </Container>
    );
  }
}
