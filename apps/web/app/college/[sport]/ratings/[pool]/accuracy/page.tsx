import type { Metadata } from "next";
import { Suspense } from "react";

import { RatingsAccuracy } from "@/components/ratings/ratings-accuracy";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { summarizePredictions } from "@/lib/ratings/accuracy";
import { getCachedPredictions, requirePool } from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH, ratingsPaths } from "@/lib/ratings/format";
import { validationReport } from "@/lib/ratings/validation";

type Params = Promise<{ sport: string; pool: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool } = await params;
  const found = await requirePool(sport, pool);
  return getPageMetadata({
    title: `${found.name} Ratings Accuracy: Every Pick, Week by Week`,
    description: `How often the ${found.name} ratings pick the winner, made before each week's games: this season week by week, every past season, and close games vs. mismatches.`,
    slug: ratingsPaths(sport, pool).accuracy,
  });
}

async function Accuracy({ params }: { params: Params }) {
  const { sport, pool } = await params;
  const found = await requirePool(sport, pool);
  const predictions = await getCachedPredictions(sport, pool, found.id);
  return (
    <RatingsAccuracy
      poolName={found.name}
      summary={summarizePredictions(predictions)}
      report={validationReport(sport, pool)}
      methodologyHref={RATINGS_METHODOLOGY_PATH}
      ratingsHref={ratingsPaths(sport, pool).latest}
    />
  );
}

export default function RatingsAccuracyPage(props: { params: Params }) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <Accuracy {...props} />
    </Suspense>
  );
}
