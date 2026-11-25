import { Badge, type BadgeVariant, Group, Table } from "@mantine/core";
import {
  IconBolt,
  IconDiscount,
  IconListDetails,
  IconMovie,
  type TablerIcon,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { formatDeduction, formatPrice, formatRate } from "../../format";
import type { CartPriceControllerPriceResponse } from "../../generated/api";
import { messages } from "../../messages";
import { iconSizes } from "../../theme/theme";

const { breakdown: labels } = messages.cartPricing;
const SUMMARY_LABEL_COLUMNS = 3;

type MovieKind = CartPriceControllerPriceResponse["lines"][number]["kind"];

const badgeByKind = {
  "saga-episode": { Icon: IconBolt, variant: "outline" },
  "regular-movie": { Icon: IconMovie, variant: "default" },
} as const satisfies Record<
  MovieKind,
  { readonly Icon: TablerIcon; readonly variant: BadgeVariant }
>;

function KindBadge({ kind }: { readonly kind: MovieKind }) {
  const { Icon, variant } = badgeByKind[kind];

  return (
    <Badge
      variant={variant}
      tt="none"
      leftSection={<Icon size={iconSizes.sm} aria-hidden />}
    >
      {labels.kinds[kind]}
    </Badge>
  );
}

function discountLabel(discountRate: number | null): string {
  return discountRate === null
    ? labels.noDiscount
    : labels.discount(formatRate(discountRate));
}

function SummaryRow({
  label,
  value,
}: {
  readonly label: ReactNode;
  readonly value: string;
}) {
  return (
    <Table.Tr>
      <Table.Th scope="row" colSpan={SUMMARY_LABEL_COLUMNS}>
        {label}
      </Table.Th>
      <Table.Td ta="right">{value}</Table.Td>
    </Table.Tr>
  );
}

export function PriceBreakdown({
  price,
}: {
  readonly price: CartPriceControllerPriceResponse;
}) {
  return (
    <Table captionSide="top">
      <Table.Caption>
        <Group gap="xs" justify="center">
          <IconListDetails size={iconSizes.md} aria-hidden />
          {labels.caption}
        </Group>
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">{labels.title}</Table.Th>
          <Table.Th scope="col">{labels.kind}</Table.Th>
          <Table.Th scope="col" ta="right">
            {labels.quantity}
          </Table.Th>
          <Table.Th scope="col" ta="right">
            {labels.unitPrice}
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {price.lines.map((line) => (
          <Table.Tr key={line.title}>
            <Table.Td>{line.title}</Table.Td>
            <Table.Td>
              <KindBadge kind={line.kind} />
            </Table.Td>
            <Table.Td ta="right">{line.quantity}</Table.Td>
            <Table.Td ta="right">{formatPrice(line.unitPrice)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
      <Table.Tfoot>
        <SummaryRow
          label={labels.sagaSubtotal}
          value={formatPrice(price.sagaSubtotal)}
        />
        <SummaryRow
          label={labels.distinctSagaEpisodeCount}
          value={String(price.distinctSagaEpisodeCount)}
        />
        <SummaryRow
          label={
            <Group gap="xs">
              <IconDiscount size={iconSizes.md} aria-hidden />
              {discountLabel(price.discountRate)}
            </Group>
          }
          value={formatDeduction(price.discount)}
        />
        <SummaryRow
          label={labels.regularSubtotal}
          value={formatPrice(price.regularSubtotal)}
        />
        <SummaryRow label={labels.total} value={formatPrice(price.total)} />
      </Table.Tfoot>
    </Table>
  );
}
