import { LaunchIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";

import type { CheckStatus } from "../types";
import { getCardTone, getStatusForegroundColor } from "./getStatusStyles";
import { StatusIcon } from "./StatusIcon";

type StatusRowProps = {
  status: CheckStatus;
  primary: string;
  secondary?: string;
  tertiary?: string;
  href?: string;
  monospace?: boolean;
  strikethrough?: boolean;
};

export function StatusRow({
  status,
  primary,
  secondary,
  tertiary,
  href,
  monospace = false,
  strikethrough = false,
}: StatusRowProps) {
  const tone = getCardTone(status);
  const foreground = getStatusForegroundColor(status);
  const linkColor = foreground ?? "var(--card-link-fg-color)";

  const primaryTextStyle = {
    fontFamily: monospace ? "var(--font-monospace)" : undefined,
    textDecoration: strikethrough ? "line-through" : undefined,
    color: href ? linkColor : foreground,
    wordBreak: "break-word" as const,
  };

  return (
    <Card padding={3} radius={2} tone={tone}>
      <Flex align="flex-start" gap={3}>
        <Flex align="center" style={{ flexShrink: 0, width: "24px" }}>
          <StatusIcon status={status} />
        </Flex>
        <Stack space={2} style={{ minWidth: 0, flex: 1 }}>
          {tertiary ? (
            <Text muted size={1}>
              {tertiary}
            </Text>
          ) : null}
          {href ? (
            <Text
              as="a"
              href={href}
              rel="noopener noreferrer"
              size={1}
              style={{
                ...primaryTextStyle,
                cursor: "pointer",
              }}
              target="_blank"
            >
              {primary}
            </Text>
          ) : (
            <Text size={1} style={primaryTextStyle}>
              {primary}
            </Text>
          )}
          {secondary ? (
            <Text
              size={1}
              style={{
                color:
                  status === "error" || status === "warning"
                    ? foreground
                    : undefined,
              }}
            >
              {secondary}
            </Text>
          ) : null}
        </Stack>
        {href ? (
          <Box style={{ flexShrink: 0 }}>
            <Button
              as="a"
              fontSize={1}
              href={href}
              icon={LaunchIcon}
              mode={status === "error" ? "default" : "ghost"}
              rel="noopener noreferrer"
              target="_blank"
              text="Open"
              tone={status === "error" ? "critical" : "default"}
            />
          </Box>
        ) : null}
      </Flex>
    </Card>
  );
}
