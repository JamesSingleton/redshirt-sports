import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type { GlobalNavigationQueryResult } from "@redshirt-sports/sanity/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { StegaBranded } from "next-sanity";

import type { Top25RankingsData } from "@/components/navbar";
import {
  navLatestPolls,
  pollNavLabel,
  sportHasRankingsNav,
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
  const showRankings = sportHasRankingsNav(latestRankings, sport.slug);
  const latestPolls = navLatestPolls(
    latestRankings.find((r) => r.sport === sport.slug)?.divisions ?? [],
  );

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
            {showRankings ? (
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
            ) : null}
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
        </div>
        <div className="rounded-xl border bg-muted/50 p-4">
          <div className="kicker mb-2 text-muted-foreground">Latest Top 25</div>
          {latestPolls.length > 0 ? (
            <ul className="grid gap-3">
              {latestPolls.map((poll) => (
                <li key={poll.division}>
                  <Link
                    href={`/college/${sport.slug}/rankings/${poll.division}/${poll.year}/${formatWeekSegment(poll.week)}`}
                    className="block rounded-md hover:underline"
                    prefetch={false}
                    onClick={onNavigate}
                  >
                    <span className="font-display text-lg font-bold uppercase leading-tight">
                      {pollNavLabel(poll.division)} Top 25
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      Week {poll.week} poll and ballots
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Coming soon</p>
          )}
        </div>
      </div>
    </>
  );
}
