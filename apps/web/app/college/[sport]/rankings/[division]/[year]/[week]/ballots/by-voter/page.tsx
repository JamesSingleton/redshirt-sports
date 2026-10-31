import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/json-ld";
import { BallotsByVoterPanel } from "@/components/rankings/ballots-by-voter-panel";
import { BallotsViewToggle } from "@/components/rankings/ballots-view-toggle";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { getCachedBallotsByVoterCards } from "@/lib/ballots-by-voter-data";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { rankingsBallotsByVoterMetaDescription } from "@/lib/rankings/meta-descriptions";
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
      title: `${year} ${shell.titleWeek} ${shell.divisionName} ${shell.sportLabel} Ballots by voter`,
      description: rankingsBallotsByVoterMetaDescription(
        shell.sportLabel,
        shell.divisionName,
        shell.titleWeek,
        year,
      ),
      slug: `${shell.weekPath}/ballots/by-voter`,
    },
    fetchOptions.perspective,
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
  return draftAwareParamsPage(
    params,
    <RankingsTabSkeleton variant="ballots" />,
    async (resolved, options) => {
      const query = await searchParams;
      return renderByVoterPage(resolved, query, options);
    },
  );
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
  fetchOptions: DynamicFetchOptions,
) {
  const shell = await loadRankingsWeekShell({
    sport,
    division,
    year,
    week,
    fetchOptions,
  });

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
      <JsonLdScript
        id={`rankings-ballots-by-voter-${sport}-${division}-${year}-${week}`}
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: `${year} ${shell.titleWeek} ${shell.divisionName} ${shell.sportLabel} Ballots by voter`,
          description: rankingsBallotsByVoterMetaDescription(
            shell.sportLabel,
            shell.divisionName,
            shell.titleWeek,
            year,
          ),
          path: shell.byVoterHref,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: shell.sportLabel, path: `/college/${sport}/news` },
            { name: "Rankings", path: shell.rankingsIndexHref },
            {
              name: `${year} ${shell.titleWeek} ${shell.divisionName}`,
              path: shell.weekPath,
            },
            { name: "Ballots", path: shell.ballotsHref },
            { name: "By voter", path: shell.byVoterHref },
          ],
          items: cards.map((card) => ({
            name: card.name || "Voter",
            path: `${shell.byVoterHref}?voter=${card.slug}`,
          })),
        })}
      />
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

      <Suspense fallback={<RankingsTabSkeleton variant="ballots" />}>
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
