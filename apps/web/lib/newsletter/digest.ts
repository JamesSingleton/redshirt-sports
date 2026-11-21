import { formatInTimeZone } from "date-fns-tz";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NEWSROOM_TIME_ZONE = "America/New_York";

/** The seven days before `now`: the articles one weekly issue covers. */
export function digestWindow(now: Date) {
  return {
    from: new Date(now.getTime() - WEEK_MS).toISOString(),
    to: now.toISOString(),
  };
}

/**
 * One issue per newsroom day. A retried or doubled cron run on the same day
 * lands on the same key and sends nothing.
 */
export function digestIssueKey(now: Date) {
  return `newsletter:weekly:${formatInTimeZone(now, NEWSROOM_TIME_ZONE, "yyyy-MM-dd")}`;
}

/** "Week of Nov 14" for the subject line and preview. */
export function digestWeekLabel(from: string) {
  return formatInTimeZone(new Date(from), NEWSROOM_TIME_ZONE, "MMM d");
}
