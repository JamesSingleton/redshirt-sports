const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const absoluteDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Phoenix",
});

/** "Jan 15, 2026" in the newsroom's timezone. */
export function formatAbsoluteDate(date: Date): string {
  return absoluteDateFormatter.format(date);
}

/**
 * "Just now", "12 min ago" or "3 hrs ago" for the first 24 hours after
 * publishing, then the absolute date.
 */
export function formatPublishedDate(date: Date, now: number): string {
  const elapsed = now - date.getTime();

  if (elapsed >= DAY_MS) {
    return formatAbsoluteDate(date);
  }
  if (elapsed < MINUTE_MS) {
    return "Just now";
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  }

  const hours = Math.floor(elapsed / HOUR_MS);
  return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
}
