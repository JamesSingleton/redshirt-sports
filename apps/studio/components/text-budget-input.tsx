import { Flex, Stack, Text } from "@sanity/ui";
import type { StringInputProps, TextInputProps } from "sanity";

type Budget = {
  /** Hard limit: going over is an error. */
  max: number;
  /** Soft target: going over is fine but worth a nudge. */
  ideal?: number;
  min?: number;
};

function tone(length: number, { max, ideal, min }: Budget) {
  if (length > max) return "critical" as const;
  if (ideal !== undefined && length > ideal) return "caution" as const;
  if (min !== undefined && length > 0 && length < min)
    return "caution" as const;
  return undefined;
}

const TONE_COLOR = {
  critical: "var(--card-badge-critical-fg-color)",
  caution: "var(--card-badge-caution-fg-color)",
} as const;

/**
 * A string or text input with a live character count against its budget.
 * Pass the same numbers the field's validation uses (see house-rules/limits).
 */
export function budgetInput(budget: Budget) {
  return function TextBudgetInput(props: StringInputProps | TextInputProps) {
    const length = props.value?.length ?? 0;
    const state = tone(length, budget);
    const target = budget.ideal ?? budget.max;

    return (
      <Stack gap={2}>
        {props.renderDefault(props as StringInputProps)}
        <Flex justify="flex-end">
          <Text
            muted={!state}
            size={1}
            style={state ? { color: TONE_COLOR[state] } : undefined}
          >
            {length} / {target}
            {budget.ideal !== undefined && length > budget.ideal
              ? ` (limit ${budget.max})`
              : ""}
          </Text>
        </Flex>
      </Stack>
    );
  };
}
