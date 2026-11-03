import type { Metadata } from "next";
import { Suspense } from "react";

import {
  BracketPageView,
  bracketTitle,
} from "@/components/bracket/bracket-page-view";
import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";
import {
  bracketEditionLabel,
  bracketPaths,
  loadLatestBracketPage,
} from "@/lib/bracket-data";
import { getPageMetadata } from "@/lib/global-seo-settings";

type Params = Promise<{ sport: string; division: string }>;

/**
 * The stable URL for a division's bracket: the newest season's official
 * bracket once published, else its latest projection. Renders, never
 * redirects; 404s until any bracket is published.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const model = await loadLatestBracketPage({ sport, division });
  return getPageMetadata({
    title: bracketTitle(model.edition),
    description: `${bracketEditionLabel(model.edition)}: the full ${bracketTitle(model.edition)}, every seed, matchup and host from Redshirt Sports.`,
    slug: bracketPaths(sport, division).landing,
  });
}

async function LatestBracket({ params }: { params: Params }) {
  const { sport, division } = await params;
  const model = await loadLatestBracketPage({ sport, division });
  return <BracketPageView model={model} />;
}

export default function LatestBracketPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<BracketSkeleton />}>
      <LatestBracket params={params} />
    </Suspense>
  );
}
