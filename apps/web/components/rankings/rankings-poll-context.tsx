import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  pollHistoryPath,
  pollLatestPath,
  pollWeekPath,
} from "@/lib/rankings/poll-paths";

/** Rankings dates are shown in Eastern time, matching the publish desk. */
function formatPublishedDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

/** Stable latest-poll page: which week this is, and a way into the archive. */
export function RankingsLatestPollContext({
  sport,
  division,
  year,
  weekSegment,
  titleWeek,
  publishedAt,
}: {
  sport: string;
  division: string;
  year: string;
  weekSegment: string;
  titleWeek: string;
  publishedAt: Date | null;
}) {
  return (
    <p
      className="pt-4 text-sm text-muted-foreground"
      data-testid="rankings-latest-context"
    >
      Latest poll:{" "}
      <Link
        href={pollWeekPath(sport, division, year, weekSegment)}
        prefetch={false}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {year} {titleWeek}
      </Link>
      {publishedAt ? (
        <> · Published {formatPublishedDate(publishedAt)}</>
      ) : null}
      {" · "}
      <Link
        href={pollHistoryPath(sport, division)}
        prefetch={false}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        See all weeks
      </Link>
    </p>
  );
}

/**
 * Week archive pages that aren't the current poll: a prominent pointer to the
 * stable latest-poll URL. Old weeks (the preseason poll especially) keep
 * ranking in search, so readers who land on them need a clear way to this
 * week's Top 25.
 */
export function RankingsArchivedWeekNotice({
  sport,
  division,
  divisionName,
  viewingLabel,
  latestLabel,
}: {
  sport: string;
  division: string;
  divisionName: string;
  /** e.g. "2026 Preseason" */
  viewingLabel: string;
  /** e.g. "2026 Week 9" */
  latestLabel: string;
}) {
  return (
    <aside
      aria-label={`Current ${divisionName} Top 25`}
      className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      data-testid="rankings-archived-week-notice"
    >
      <p className="text-muted-foreground">
        You&apos;re viewing the {viewingLabel} poll.
      </p>
      <Link
        href={pollLatestPath(sport, division)}
        prefetch={false}
        className="inline-flex items-center font-semibold text-foreground underline-offset-4 hover:underline"
      >
        See this week&apos;s {divisionName} Top 25 ({latestLabel})
        <ChevronRight className="ml-0.5 size-4 opacity-70" aria-hidden />
      </Link>
    </aside>
  );
}

/** Week archive pages: jump to whatever poll is current. */
export function RankingsLatestPollLink({
  sport,
  division,
  divisionName,
}: {
  sport: string;
  division: string;
  divisionName: string;
}) {
  return (
    <p className="pt-4 text-sm">
      <Link
        href={pollLatestPath(sport, division)}
        prefetch={false}
        className="inline-flex items-center font-medium underline-offset-4 hover:underline"
      >
        Latest {divisionName} poll
        <ChevronRight className="ml-0.5 size-3.5 opacity-60" aria-hidden />
      </Link>
    </p>
  );
}
