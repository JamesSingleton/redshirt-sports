/**
 * House rules are plain functions: content in, findings out. They import
 * nothing from Sanity, so the same rule powers schema validation, the Article
 * Check pane, migrations, and unit tests.
 *
 * `error` blocks publishing. `warning` is advice a writer can overrule.
 */
export type Level = "error" | "warning";

export type Finding = {
  /** Stable id, e.g. "headline.length". */
  rule: string;
  level: Level;
  message: string;
  /** `_key` of the body block the finding points at, when there is one. */
  blockKey?: string;
};

export const error = (
  rule: string,
  message: string,
  blockKey?: string,
): Finding => ({ rule, level: "error", message, blockKey });

export const warning = (
  rule: string,
  message: string,
  blockKey?: string,
): Finding => ({ rule, level: "warning", message, blockKey });

export type Reference = { _ref?: string; _type?: string; _key?: string };

export type Span = {
  _type: "span";
  _key?: string;
  text?: string;
  marks?: string[];
};

export type MarkDef = {
  _key: string;
  _type: string;
  [key: string]: unknown;
};

export type TextBlock = {
  _type: "block";
  _key: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: Array<Span | { _type: string; [key: string]: unknown }>;
  markDefs?: MarkDef[];
};

export type ObjectBlock = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

export type BodyBlock = TextBlock | ObjectBlock;

export const isTextBlock = (block: unknown): block is TextBlock =>
  typeof block === "object" &&
  block !== null &&
  (block as { _type?: string })._type === "block";

export const isSpan = (child: unknown): child is Span =>
  typeof child === "object" &&
  child !== null &&
  (child as { _type?: string })._type === "span";

export type GroupedFinding = Finding & { count: number };

/**
 * One row per distinct problem. The same style slip in nine paragraphs is one
 * thing to fix, so it shows once with a count; the form still marks each
 * paragraph.
 */
export function groupFindings(findings: Finding[]): GroupedFinding[] {
  const groups = new Map<string, GroupedFinding>();
  for (const finding of findings) {
    const id = `${finding.level}|${finding.rule}|${finding.message}`;
    const existing = groups.get(id);
    if (existing) existing.count += 1;
    else groups.set(id, { ...finding, count: 1 });
  }
  // Errors first, then the most frequent.
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.level === "error") - Number(a.level === "error") ||
      b.count - a.count,
  );
}
