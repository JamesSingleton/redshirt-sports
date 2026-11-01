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
