import { Flex, Stack, Text } from "@sanity/ui";
import { useMemo } from "react";
import type { PortableTextInputProps } from "sanity";

import { bodyStats } from "@/house-rules/body";
import type { BodyBlock } from "@/house-rules/types";

/** The article editor with a running word count and reading time under it. */
export function BodyInput(props: PortableTextInputProps) {
  const stats = useMemo(
    () => bodyStats(props.value as BodyBlock[] | undefined),
    [props.value],
  );

  return (
    <Stack gap={2}>
      {props.renderDefault(props)}
      <Flex gap={3} justify="flex-end" wrap="wrap">
        <Text muted size={1}>
          {stats.words.toLocaleString("en-US")} words
        </Text>
        <Text muted size={1}>
          {stats.readingMinutes} min read
        </Text>
        <Text muted size={1}>
          {stats.internalLinks} internal · {stats.externalLinks} external links
        </Text>
      </Flex>
    </Stack>
  );
}
