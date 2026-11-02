import type { Metadata } from "next";
import { Suspense } from "react";

import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { TeamSheetPage } from "@/components/ratings/team-sheet-page";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRatingsTeam } from "@/lib/ratings/data";
import { ratingsPaths } from "@/lib/ratings/format";

type Params = Promise<{
  sport: string;
  pool: string;
  year: string;
  week: string;
  slug: string;
}>;

/** Archived team sheets stay reachable but out of the index: ~130 near-duplicates a week. */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool, year, week, slug } = await params;
  const { model, row } = await loadRatingsTeam({
    sport,
    pool,
    year,
    week,
    slug,
  });
  return getPageMetadata({
    title: `${row.name} ${model.pool.name} Team Sheet, ${model.week.year} ${model.week.label}`,
    slug: ratingsPaths(sport, pool).weekTeam(
      model.week.year,
      model.week.segment,
      slug,
    ),
    noIndex: true,
  });
}

async function WeekTeam({ params }: { params: Params }) {
  const { sport, pool, year, week, slug } = await params;
  return (
    <TeamSheetPage
      data={await loadRatingsTeam({ sport, pool, year, week, slug })}
    />
  );
}

export default function WeekTeamSheetPage(props: { params: Params }) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <WeekTeam {...props} />
    </Suspense>
  );
}
