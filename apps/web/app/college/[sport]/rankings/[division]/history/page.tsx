import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/json-ld";
import { RankingsHistoryContent } from "@/components/rankings/rankings-history-content";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import {
  getCachedPollHistoryForDivision,
  getCachedPollHistoryYears,
} from "@/lib/poll-history-data";
import {
  getCachedLatestFinalRankings,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
} from "@/lib/rankings-data";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import { sportNavLabel } from "@/lib/sport-nav";
import type { SportParam } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const divisionName = pollDivisionLabel(division);
  const sportLabel = sportNavLabel(sport, sport);
  return getPageMetadata(
    {
      title: `${sportLabel} ${divisionName} Poll History`,
      description: `Weekly No. 1 teams and poll history for the ${sportLabel} ${divisionName} Top 25.`,
      slug: `/college/${sport}/rankings/${division}/history`,
    },
    "published",
  );
}

export default function RankingsHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  return draftAwareParamsPage(
    params,
    <RankingsTabSkeleton variant="history" />,
    async (resolved) => {
      const query = await searchParams;
      return renderHistoryPage(resolved, query);
    },
  );
}

async function renderHistoryPage(
  { sport, division }: { sport: string; division: string },
  query: { year?: string },
) {
  "use cache";
  const sportParam = sport as SportParam;
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sportParam),
    rankingsDivisionTag(sportParam, division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const divisionName = pollDivisionLabel(division);
  const sportLabel = sportNavLabel(sport, sport);
  const methodologyHref = rankingsMethodologyHref();

  const [years, latest] = await Promise.all([
    getCachedPollHistoryYears(division),
    getCachedLatestFinalRankings({ division }),
  ]);

  if (!years.length || !latest) {
    notFound();
  }

  const yearNumber = query.year ? Number(query.year) : latest.year;
  if (!years.some((row) => row.year === yearNumber)) {
    notFound();
  }

  const season = await getCachedPollHistoryForDivision({
    sport: sportParam,
    division,
    year: yearNumber,
  });
  if (!season) {
    notFound();
  }

  const historyPath = `/college/${sport}/rankings/${division}/history`;

  return (
    <>
      <JsonLdScript
        id={`rankings-history-${sport}-${division}`}
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: `${sportLabel} ${divisionName} Poll History`,
          description: `Weekly No. 1 teams and poll history for the ${sportLabel} ${divisionName} Top 25.`,
          path: query.year ? `${historyPath}?year=${yearNumber}` : historyPath,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: sportLabel, path: `/college/${sport}/news` },
            { name: "Rankings", path: `/college/${sport}/rankings` },
            { name: "History", path: historyPath },
          ],
          items: years.map((row) => ({
            name: String(row.year),
            path: `${historyPath}?year=${row.year}`,
          })),
        })}
      />
      <div className="mt-3">
        <div className="kicker text-primary">
          Redshirt Sports Poll · {divisionName}
        </div>
        <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
          {divisionName} Poll History
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Week-by-week No. 1 teams ·{" "}
          <Link
            href={methodologyHref}
            prefetch={false}
            className="text-primary underline-offset-2 hover:underline"
          >
            Methodology
          </Link>
        </p>
      </div>

      <RankingsHistoryContent
        sport={sport}
        division={division}
        seasons={years}
        activeSeason={season}
      />
    </>
  );
}
