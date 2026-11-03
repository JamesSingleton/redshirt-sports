import type { Metadata } from "next";
import { Suspense } from "react";

import {
  BracketPageView,
  bracketTitle,
} from "@/components/bracket/bracket-page-view";
import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";
import { bracketEditionLabel, loadBracketPage } from "@/lib/bracket-data";
import { getPageMetadata } from "@/lib/global-seo-settings";

type Params = Promise<{ sport: string; division: string; year: string }>;

/**
 * The season's bracket: the official one once the committee's field is
 * published, until then the newest projection. 404s until something is published.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, division, year } = await params;
  const model = await loadBracketPage({ sport, division, year });
  return getPageMetadata({
    title: bracketTitle(model.edition),
    description: `${bracketEditionLabel(model.edition)}: the full ${bracketTitle(model.edition)}, every seed, matchup and host from Redshirt Sports.`,
    slug: `/college/${sport}/playoffs/${division}/${year}`,
  });
}

async function SeasonBracket({ params }: { params: Params }) {
  const { sport, division, year } = await params;
  const model = await loadBracketPage({ sport, division, year });
  return <BracketPageView model={model} />;
}

export default function SeasonBracketPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<BracketSkeleton />}>
      <SeasonBracket params={params} />
    </Suspense>
  );
}
