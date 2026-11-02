import type { Metadata } from "next";
import { Suspense } from "react";

import { ratingsTitle } from "@/components/ratings/ratings-header";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { RatingsWeekView } from "@/components/ratings/ratings-week-view";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRatingsWeek } from "@/lib/ratings/data";
import { parseSort, ratingsPaths } from "@/lib/ratings/format";

type Params = Promise<{ sport: string; pool: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The stable URL for a pool: always the latest published week. 404s until the
 * first week is published, so an unlaunched pool is never indexed.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool } = await params;
  const model = await loadRatingsWeek({ sport, pool });
  return getPageMetadata({
    title: `${ratingsTitle(model)} (${model.week.year})`,
    description: `${model.pool.name} strength of schedule, strength of record, and power ratings for ${model.week.year} ${model.week.label}, counting only ${model.pool.name}-vs-${model.pool.name} games. Every number shows its work.`,
    slug: ratingsPaths(sport, pool).latest,
  });
}

async function LatestRatings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ sport, pool }, query] = await Promise.all([params, searchParams]);
  const model = await loadRatingsWeek({ sport, pool });
  return (
    <RatingsWeekView
      model={model}
      sort={parseSort(query.sort)}
      basePath={ratingsPaths(sport, pool).latest}
    />
  );
}

export default function LatestRatingsPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <LatestRatings {...props} />
    </Suspense>
  );
}
