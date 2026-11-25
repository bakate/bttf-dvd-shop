import { notifications } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";

import { iconSizes } from "./theme/theme";

export function notifyError({
  title,
  message,
}: {
  readonly title: string;
  readonly message: string;
}): void {
  notifications.show({
    color: "danger",
    icon: <IconAlertTriangle size={iconSizes.md} aria-hidden />,
    title,
    message,
  });
}
