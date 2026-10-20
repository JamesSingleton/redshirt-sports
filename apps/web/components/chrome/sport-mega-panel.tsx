import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type { GlobalNavigationQueryResult } from "@redshirt-sports/sanity/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { StegaBranded } from "next-sanity";

import type { Top25RankingsData } from "@/components/navbar";
import {
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

export function SportMegaPanel({
  sport,
  latestRankings,
  onNavigate,
}: {
  sport: StegaBranded<GlobalNavigationQueryResult>[number];
  latestRankings: Top25RankingsData;
  onNavigate?: () => void;
}) {
  const label = sportNavLabel(sport.slug, sport.name);
  const sportRankings =
    latestRankings.find((r) => r.sport === sport.slug)?.divisions ?? [];
  const latestPoll = sportRankings[0];

  return (
    <>
      <div className="mx-auto flex max-w-site items-center gap-3 border-b px-6 py-2.5 text-sm">
        <Link
          href={sportHubPath(sport.slug)}
          className="font-semibold hover:underline"
          prefetch={false}
          onClick={onNavigate}
        >
          {label} hub
          <ChevronRight className="ml-0.5 inline size-3.5 opacity-60" />
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          /college/{sport.slug}
        </span>
      </div>
      <div className="mx-auto grid max-w-site grid-cols-[1fr_1fr_1fr_1.1fr] gap-8 px-6 py-6">
        <div>
          <div className="kicker mb-2 text-primary">{label}</div>
          <ul className="grid gap-0.5">
            <li>
              <Link
                href={sportHubPath(sport.slug)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
                onClick={onNavigate}
              >
                All {label} news
                <ChevronRight className="size-3.5 opacity-40" />
              </Link>
            </li>
            <li>
              <Link
                href={sportRankingsIndexPath(sport.slug)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
                onClick={onNavigate}
              >
                Rankings
                <ChevronRight className="size-3.5 opacity-40" />
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="kicker mb-2 text-muted-foreground">By division</div>
          <ul className="grid gap-0.5">
            {sport.groupings.map((grouping) =>
              grouping?.slug ? (
                <li key={grouping._id}>
                  <Link
                    href={`/college/${sport.slug}/news/${grouping.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    prefetch={false}
                    onClick={onNavigate}
                  >
                    {grouping.name} news
                    <ChevronRight className="size-3.5 opacity-40" />
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </div>
        <div>
          <div className="kicker mb-2 text-muted-foreground">Teams</div>
          <ul className="grid gap-0.5">
            <li>
              <Link
                href="/college/teams"
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
                onClick={onNavigate}
              >
                All teams A–Z
                <ChevronRight className="size-3.5 opacity-40" />
              </Link>
            </li>
          </ul>
          <p className="mt-2 px-2 text-xs text-muted-foreground">
            Every school we cover. Team pages live at{" "}
            <span className="font-mono">/college/teams/[school]</span>.
          </p>
        </div>
        <div className="rounded-xl border bg-muted/50 p-4">
          <div className="kicker mb-2 text-muted-foreground">Latest Top 25</div>
          {latestPoll?.division && latestPoll.year && latestPoll.week != null ? (
            <>
              <div className="ad-slot relative aspect-[16/9] overflow-hidden rounded-lg">
                <span className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Poll graphic placeholder
                </span>
              </div>
              <div className="mt-3 font-display text-lg font-bold uppercase leading-tight">
                {label} Top 25
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  href={`/college/${sport.slug}/rankings/${latestPoll.division}/${latestPoll.year}/${formatWeekSegment(latestPoll.week)}`}
                  className="font-semibold text-foreground hover:underline"
                  prefetch={false}
                  onClick={onNavigate}
                >
                  Week {latestPoll.week} poll and ballots
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Coming soon</p>
          )}
        </div>
      </div>
    </>
  );
}
