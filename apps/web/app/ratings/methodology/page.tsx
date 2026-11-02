import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  type MethodologyPool,
  RatingsMethodology,
} from "@/components/ratings/ratings-methodology";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedPublicPools } from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH, ratingsPaths } from "@/lib/ratings/format";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "How Our Computer Ratings & Strength of Schedule Work",
    description:
      "The full method behind Redshirt Sports' strength of schedule, strength of record, and power ratings, counting only games between teams at the same level, with every fitted number.",
    slug: RATINGS_METHODOLOGY_PATH,
  });
}

async function Methodology() {
  const pools: MethodologyPool[] = (await getCachedPublicPools()).map(
    (pool) => {
      const paths = ratingsPaths(pool.sportSlug, pool.slug);
      return {
        label: `${pool.name} ${pool.sportName.toLowerCase()}`,
        name: pool.name,
        anchor: `${pool.sportSlug}-${pool.slug}`,
        config: pool.config,
        methodVersion: pool.methodVersion,
        ratingsHref: paths.latest,
        accuracyHref: paths.accuracy,
      };
    },
  );
  // Nothing public yet (or the ratings tables aren't migrated): no page to index.
  if (pools.length === 0) notFound();
  return (
    <div className="mx-auto w-full max-w-site min-w-0 px-4 pb-12 lg:px-6">
      <RatingsMethodology pools={pools} />
    </div>
  );
}

export default function RatingsMethodologyPage() {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <Methodology />
    </Suspense>
  );
}
