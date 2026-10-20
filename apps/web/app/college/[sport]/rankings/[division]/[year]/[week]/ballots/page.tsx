import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BallotsMatrixPanel } from "@/components/rankings/ballots-matrix-panel";
import { BallotsViewToggle } from "@/components/rankings/ballots-view-toggle";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { getCachedBallotsPageMatrix } from "@/lib/ballots-page-data";
import { resolveVoterHighlightUserIds } from "@/lib/voter-ballot-slug";
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
      title: `${year} ${shell.titleWeek} ${shell.divisionName} Ballots`,
      description: `Full voter ballots for the ${shell.divisionName} Top 25, ${shell.titleWeek} ${year}.`,
      slug: `${shell.weekPath}/ballots`,
    },
    "published",
  );
}

export default function RankingsBallotsPage({
  params,
  searchParams,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
  searchParams: Promise<{ voters?: string; voter?: string }>;
}) {
  return draftAwareParamsPage(
    params,
    <RankingsTabSkeleton variant="ballots" />,
    async (resolved) => {
      const query = await searchParams;
      return renderBallotsPage(resolved, query);
    },
  );
}

async function renderBallotsPage(
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
  query: { voters?: string; voter?: string },
) {
  const shell = await loadRankingsWeekShell({ sport, division, year, week });
  const matrix = await getCachedBallotsPageMatrix({
    year: shell.yearNumber,
    week: shell.weekNumber,
    division,
    sport: shell.sportParam,
  });

  if (!matrix) {
    notFound();
  }

  const highlightTokens = [
    ...(query.voter ? [query.voter.trim()] : []),
    ...(query.voters?.split(",").map((t) => t.trim()).filter(Boolean) ?? []),
  ];
  const highlightVoterIds = resolveVoterHighlightUserIds(
    highlightTokens,
    matrix.voters,
  );

  return (
    <>
      <p className="pt-4 text-sm text-muted-foreground">
        {matrix.ballotsCounted} ballots counted
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <BallotsViewToggle
          allBallotsHref={shell.ballotsHref}
          byVoterHref={shell.byVoterHref}
          active="matrix"
        />
      </div>

      <div className="pt-4">
        <Suspense fallback={null}>
          <BallotsMatrixPanel
            matrix={matrix}
            highlightVoterIds={highlightVoterIds}
          />
        </Suspense>
      </div>
    </>
  );
}
