import type { PollWeekNumberOne } from "@/lib/poll-history-data";

/** Short axis/header label for dense week columns. */
export function shortPollWeekLabel(
  week: PollWeekNumberOne,
  index: number,
): string {
  const label = week.weekLabel;
  const lower = label.toLowerCase();
  if (lower.includes("preseason")) {
    return "Pre";
  }
  if (lower.includes("final")) {
    return "Fin";
  }
  const match = label.match(/week\s*(\d+)/i);
  if (match) {
    return `W${match[1]}`;
  }
  if (label.length <= 6) {
    return label;
  }
  return `W${index}`;
}
