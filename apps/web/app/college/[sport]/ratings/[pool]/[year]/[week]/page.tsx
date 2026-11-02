import type { Metadata } from "next";
import { Suspense } from "react";

import { ratingsTitle } from "@/components/ratings/ratings-header";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { RatingsWeekView } from "@/components/ratings/ratings-week-view";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRatingsWeek } from "@/lib/ratings/data";
import { parseSort, parseSortDir, ratingsPaths } from "@/lib/ratings/format";

type Params = Promise<{
  sport: string;
  pool: string;
  year: string;
  week: string;
}>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool, year, week } = await params;
  const model = await loadRatingsWeek({ sport, pool, year, week });
  return getPageMetadata({
    title: `${model.week.year} ${model.week.label} ${ratingsTitle(model)}`,
    description: `${model.pool.name} strength of schedule, strength of record, and power ratings as published for ${model.week.year} ${model.week.label}. Archived exactly as published.`,
    slug: ratingsPaths(sport, pool).week(model.week.year, model.week.segment),
  });
}

async function WeekRatings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ sport, pool, year, week }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const model = await loadRatingsWeek({ sport, pool, year, week });
  return (
    <RatingsWeekView
      model={model}
      sort={parseSort(query.sort)}
      dir={parseSortDir(query.dir)}
      basePath={ratingsPaths(sport, pool).week(
        model.week.year,
        model.week.segment,
      )}
    />
  );
}

export default function RatingsWeekPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <WeekRatings {...props} />
    </Suspense>
  );
}
