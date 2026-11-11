import type {
  CustomValidator,
  CustomValidatorResult,
  Path,
  ValidationContext,
} from "sanity";

import type { Finding, Level } from "./types";

type Check<T> = (value: T | undefined, context: ValidationContext) => Finding[];

/** The slice of Sanity's per-type rule classes that house rules use. */
type CustomRule<R> = {
  // biome-ignore lint/suspicious/noExplicitAny: each rule class types its own value
  custom(fn: CustomValidator<any>): R;
  required(): R;
  error(message?: string): R;
  warning(message?: string): R;
};

function toResult(
  findings: Finding[],
  level: Level,
  basePath?: Path,
): CustomValidatorResult {
  const matching = findings.filter((finding) => finding.level === level);
  if (matching.length === 0) return true;

  const located = matching.filter((finding) => finding.blockKey);
  if (located.length === matching.length) {
    // Each finding lands on its own block, so the editor can jump to it.
    return located.map((finding) => ({
      message: finding.message,
      path: [...(basePath ?? []), { _key: finding.blockKey as string }],
    }));
  }
  return matching.map((finding) => finding.message).join(" ");
}

/**
 * Turn a house rule into Sanity validation: its errors block publishing and
 * its warnings show as advice. Use as
 * `validation: (rule) => houseRule(rule, (value) => headlineFindings(value))`.
 *
 * Pass `required` (the message to show) for a field that must have a value.
 * That adds Sanity's own `required()`, which is what makes the generated
 * TypeScript type non-optional, and mutes the rule's own "*.required" finding
 * so the writer isn't told twice.
 */
export function houseRule<T, R extends CustomRule<R>>(
  rule: R,
  check: Check<T>,
  options: { required?: string } = {},
): R[] {
  const run = (value: unknown, context: ValidationContext) => {
    const findings = check(value as T | undefined, context);
    return options.required
      ? findings.filter((finding) => !finding.rule.endsWith(".required"))
      : findings;
  };
  return [
    ...(options.required ? [rule.required().error(options.required)] : []),
    rule.custom((value: unknown, context: ValidationContext) =>
      toResult(run(value, context), "error"),
    ),
    rule
      .custom((value: unknown, context: ValidationContext) =>
        toResult(run(value, context), "warning"),
      )
      .warning(),
  ];
}
