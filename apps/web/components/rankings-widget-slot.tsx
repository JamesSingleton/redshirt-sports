import type { SportParam } from "@redshirt-sports/clients/espn";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
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

const PLACEHOLDER_ROWS = 10;

/** Placeholder text that keeps the real text's line height. */
function TextBar({ children }: { children: string }) {
  return (
    <span className="animate-pulse rounded-md bg-accent text-transparent motion-reduce:animate-none">
      {children}
    </span>
  );
}

/**
 * The card's own header, ten rows and footer with placeholders in them, so
 * it is exactly as tall as the card and the sidebar below doesn't move when
 * the card streams in.
 */
export function RankingsWidgetSkeleton() {
  return (
    <Card
      data-testid="rankings-widget-skeleton"
      className="gap-0 py-0 shadow-xs"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading rankings…
      </span>
      <CardHeader
        className="flex items-start justify-between gap-2 px-5 pt-5"
        aria-hidden
      >
        <div className="grid gap-1">
          <CardTitle className="font-display text-xl font-bold leading-[1.08]">
            <TextBar>FCS Top 25</TextBar>
          </CardTitle>
          <CardDescription>
            <TextBar>Week 10 · 2026</TextBar>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-2" aria-hidden>
        <ol className="divide-y">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="w-5 text-right font-display text-lg font-bold tabular">
                <TextBar>{String(i + 1)}</TextBar>
              </span>
              <Skeleton className="size-7 shrink-0 rounded-full motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 text-sm font-semibold">
                <TextBar>Team name</TextBar>
              </div>
              <span className="w-9" />
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="flex gap-2 px-5 pt-3 pb-5" aria-hidden>
        <Skeleton className="h-8 flex-1 motion-reduce:animate-none" />
        <Skeleton className="h-8 flex-1 motion-reduce:animate-none" />
      </CardFooter>
    </Card>
  );
}
