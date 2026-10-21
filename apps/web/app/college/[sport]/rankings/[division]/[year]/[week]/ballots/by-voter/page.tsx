import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BallotsByVoterPanel } from "@/components/rankings/ballots-by-voter-panel";
import { BallotsViewToggle } from "@/components/rankings/ballots-view-toggle";
import { getCachedBallotsByVoterCards } from "@/lib/ballots-by-voter-data";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRankingsWeekShell } from "@/lib/rankings-week-shell";

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
  const shell = await loadRankingsWeekShell({ sport, division, year, week });
  return getPageMetadata(
    {
      title: `${year} ${shell.titleWeek} ${shell.divisionName} Ballots by voter`,
      description: `Each voter's full Top 25 ballot for ${shell.titleWeek} ${year}.`,
      slug: `${shell.weekPath}/ballots/by-voter`,
    },
    "published",
  );
}

export default function RankingsBallotsByVoterPage({
  params,
  searchParams,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
  searchParams: Promise<{ voter?: string }>;
}) {
  return draftAwareParamsPage(params, null, async (resolved) => {
    const query = await searchParams;
    return renderByVoterPage(resolved, query);
  });
}

async function renderByVoterPage(
  {
    sport,
    division,
    year,
    week,
  }: {
    sport: string;
    division: string;
    year: string;
    week: string;
  },
  query: { voter?: string },
) {
  const shell = await loadRankingsWeekShell({ sport, division, year, week });

  const cards = await getCachedBallotsByVoterCards({
    year: shell.yearNumber,
    week: shell.weekNumber,
    division,
    sport: shell.sportParam,
  });

  if (!cards.length) {
    notFound();
  }

  return (
    <>
      <p className="pt-4 text-sm text-muted-foreground">
        {cards.length} voters · full 25-team ballot for each · diff vs the
        published consensus
      </p>

      <div className="pt-4">
        <BallotsViewToggle
          allBallotsHref={shell.ballotsHref}
          byVoterHref={shell.byVoterHref}
          active="by-voter"
        />
      </div>

      <Suspense fallback={null}>
        <BallotsByVoterPanel
          cards={cards}
          ballotsHref={shell.ballotsHref}
          byVoterPath={shell.byVoterHref}
          initialVoterSlug={query.voter?.trim() || null}
        />
      </Suspense>
    </>
  );
}
