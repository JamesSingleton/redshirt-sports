import type { AutoPublishSchedule } from "@redshirt-sports/db/queries";

/** "Mon, Nov 9, 9:00 AM CST", in Central time whatever the viewer's zone. */
export function formatAutoPublishTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export type AutoPublishLabel = {
  text: string;
  /** "warning": the run will skip this week unless ballots come in. */
  tone: "scheduled" | "warning" | "muted";
};

/** One line on what the next Monday run will do for a poll. */
export function describeAutoPublish(
  schedule: AutoPublishSchedule,
): AutoPublishLabel {
  const when = formatAutoPublishTime(schedule.runAt);
  const week = schedule.weekLabel ?? "This week";
  switch (schedule.status) {
    case "scheduled":
      return { text: `Auto-publishes ${week} · ${when}`, tone: "scheduled" };
    case "no-ballots":
      return {
        text: `No ballots in for ${week} yet · ${when} will skip it unless some come in`,
        tone: "warning",
      };
    case "published":
      return { text: `${week} already published`, tone: "muted" };
    case "manual":
      return { text: `${week} publishes manually`, tone: "muted" };
    case "no-week":
      return { text: `No voting week synced for ${when}`, tone: "muted" };
    case "off":
      return { text: "Auto-publish off · publish manually", tone: "muted" };
  }
}
