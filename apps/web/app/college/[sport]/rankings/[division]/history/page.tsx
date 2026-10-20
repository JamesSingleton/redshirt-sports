import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RankingsHistoryContent } from "@/components/rankings/rankings-history-content";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedPollHistoryForDivision,
  getCachedPollHistoryYears,
} from "@/lib/poll-history-data";
import { getCachedLatestFinalRankings } from "@/lib/rankings-data";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import type { SportParam } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const divisionName = pollDivisionLabel(division);
  return getPageMetadata(
    {
      title: `${divisionName} Poll History`,
      description: `Weekly No. 1 teams and poll history for the ${divisionName} Top 25.`,
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
  const sportParam = sport as SportParam;
  const divisionName = pollDivisionLabel(division);
  const methodologyHref = rankingsMethodologyHref(sport, division);

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

  return (
    <>
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
