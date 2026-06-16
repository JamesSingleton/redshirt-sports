import { RefreshIcon } from "@sanity/icons";
import { Badge, Box, Button, Flex, Heading, Stack, Text } from "@sanity/ui";

type SectionHeaderProps = {
  title: string;
  badge?: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
};

export function SectionHeader({
  title,
  badge,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <Stack space={3}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Flex align="center" gap={3} wrap="wrap">
          <Heading as="h2" size={1}>
            {title}
          </Heading>
          {badge ? <Badge tone="default">{badge}</Badge> : null}
        </Flex>
        {action ? (
          <Button
            disabled={action.disabled}
            fontSize={1}
            icon={RefreshIcon}
            loading={action.loading}
            mode="ghost"
            onClick={action.onClick}
            text={action.label}
          />
        ) : null}
      </Flex>
      <Box>
        <Text muted size={1}>
          {description}
        </Text>
      </Box>
    </Stack>
  );
}

export function SectionDivider() {
  return (
    <Box
      style={{
        borderTop: "1px solid var(--card-border-color)",
        marginTop: "8px",
      }}
    />
  );
}
