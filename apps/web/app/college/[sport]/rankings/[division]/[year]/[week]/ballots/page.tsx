import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/json-ld";
import { BallotsMatrixPanel } from "@/components/rankings/ballots-matrix-panel";
import { BallotsViewToggle } from "@/components/rankings/ballots-view-toggle";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { getCachedBallotsPageMatrix } from "@/lib/ballots-page-data";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { rankingsBallotsMetaDescription } from "@/lib/rankings/meta-descriptions";
import { loadRankingsWeekShell } from "@/lib/rankings-week-shell";
import { resolveVoterHighlightUserIds } from "@/lib/voter-ballot-slug";

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
  const [{ sport, division, year, week }, fetchOptions] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const shell = await loadRankingsWeekShell({
    sport,
    division,
    year,
    week,
    fetchOptions,
  });
  return getPageMetadata(
    {
      title: `${year} ${shell.titleWeek} ${shell.divisionName} ${shell.sportLabel} Ballots`,
      description: rankingsBallotsMetaDescription(
        shell.sportLabel,
        shell.divisionName,
        shell.titleWeek,
        year,
      ),
      slug: `${shell.weekPath}/ballots`,
    },
    fetchOptions.perspective,
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
    async (resolved, options) => {
      const query = await searchParams;
      return renderBallotsPage(resolved, query, options);
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
  fetchOptions: DynamicFetchOptions,
) {
  const shell = await loadRankingsWeekShell({
    sport,
    division,
    year,
    week,
    fetchOptions,
  });
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
    ...(query.voters
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? []),
  ];
  const highlightVoterIds = resolveVoterHighlightUserIds(
    highlightTokens,
    matrix.voters,
  );

  return (
    <>
      <JsonLdScript
        id={`rankings-ballots-${sport}-${division}-${year}-${week}`}
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: `${year} ${shell.titleWeek} ${shell.divisionName} ${shell.sportLabel} Ballots`,
          description: rankingsBallotsMetaDescription(
            shell.sportLabel,
            shell.divisionName,
            shell.titleWeek,
            year,
          ),
          path: shell.ballotsHref,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: shell.sportLabel, path: `/college/${sport}/news` },
            { name: "Rankings", path: shell.rankingsIndexHref },
            {
              name: `${year} ${shell.titleWeek} ${shell.divisionName}`,
              path: shell.weekPath,
            },
            { name: "Ballots", path: shell.ballotsHref },
          ],
          items: matrix.voters.map((voter) => ({
            name: voter.label,
            path: `${shell.byVoterHref}?voter=${voter.slug}`,
          })),
        })}
      />
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

      <div className="min-w-0 pt-4">
        <Suspense fallback={<RankingsTabSkeleton variant="ballots" />}>
          <BallotsMatrixPanel
            matrix={matrix}
            highlightVoterIds={highlightVoterIds}
          />
        </Suspense>
      </div>
    </>
  );
}
