import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RankingsVoterBreakdown } from "@/components/rankings/rankings-voter-breakdown";
import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { VoterBreakdownSkeleton } from "@/components/rankings/voter-breakdown-skeleton";
import { TOP_25 } from "@/lib/constants";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedFinalRankings } from "@/lib/rankings-data";
import { parseWeekSegment, type SportParam, weekTitle } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}): Promise<Metadata> {
  const { sport, division, year, week } = await params;
  return getPageMetadata(
    {
      title: `${year} ${weekTitle(parseWeekSegment(week))} ${division.toUpperCase()} Ballots`,
      description: `Every voter ballot for the ${division.toUpperCase()} Top 25.`,
      slug: `/college/${sport}/rankings/${division}/${year}/${week}/ballots`,
    },
    "published",
  );
}

export default async function BallotsPage({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}) {
  const { sport, division, year, week } = await params;
  const yearNumber = Number(year);
  if (!/^\d{4}$/.test(year)) notFound();

  let weekNumber: number;
  try {
    weekNumber = parseWeekSegment(week);
  } catch {
    notFound();
  }

  const sportParam = sport as SportParam;
  const result = await getCachedFinalRankings({
    year: yearNumber,
    week: weekNumber,
    division,
    sport: sportParam,
  }).catch(() => null);

  if (!result) notFound();

  const consensus = result.rankings
    .filter((team) => (team.rank ?? 0) <= TOP_25)
    .map((team) => ({
      id: team._id,
      rank: team.rank as number,
    }));

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">
        Redshirt Sports Poll · {division.toUpperCase()}
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        {year} {weekTitle(weekNumber)} ballots
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Every counted ballot for this week, compared to the published poll.
      </p>
      <RankingsTabs
        sport={sport}
        division={division}
        year={year}
        week={week}
        active="ballots"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/college/${sport}/rankings/${division}/${year}/${week}/ballots/by-voter`}
          className={buttonVariants({ variant: "outline" })}
          prefetch={false}
        >
          Browse by voter
        </Link>
      </div>
      <Suspense fallback={<VoterBreakdownSkeleton />}>
        <RankingsVoterBreakdown
          division={division}
          year={yearNumber}
          week={weekNumber}
          sport={sportParam}
          consensusRanks={consensus}
        />
      </Suspense>
    </div>
  );
}
