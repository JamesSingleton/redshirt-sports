import type { SportParam } from "@redshirt-sports/clients/espn";
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { connection } from "next/server";
import { Suspense } from "react";

import { RankingsWidget } from "@/components/rankings-widget";
import {
  getCachedRankingsWidgetPolls,
  sportHasRankingsWidget,
} from "@/lib/rankings-widget-data";

/**
 * The sidebar Top 25 card, rendered on each request from the shared rankings
 * cache instead of being written into the page's static shell. A Monday
 * publish then shows up without rewriting every article and archive page.
 */
export function RankingsWidgetSlot({
  sport = "football",
}: {
  sport?: SportParam;
}) {
  if (!sportHasRankingsWidget(sport)) {
    return null;
  }

  return (
    <Suspense fallback={<RankingsWidgetSkeleton />}>
      <RequestTimeRankingsWidget sport={sport} />
    </Suspense>
  );
}

/** Exported for tests. Render `RankingsWidgetSlot`, which supplies the boundary. */
export async function RequestTimeRankingsWidget({
  sport,
}: {
  sport: SportParam;
}) {
  await connection();
  const polls = await getCachedRankingsWidgetPolls(sport);
  return polls.length > 0 ? <RankingsWidget polls={polls} /> : null;
}

/** Same footprint as the card with its ten rows, so the sidebar doesn't jump. */
export function RankingsWidgetSkeleton() {
  return (
    <Skeleton
      data-testid="rankings-widget-skeleton"
      className="h-[635px] w-full rounded-xl"
    />
  );
}
