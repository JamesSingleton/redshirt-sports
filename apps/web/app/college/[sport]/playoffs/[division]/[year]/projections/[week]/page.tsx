import type { Metadata } from "next";
import { Suspense } from "react";

import {
  BracketPageView,
  bracketDescription,
  bracketTitle,
} from "@/components/bracket/bracket-page-view";
import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";
import { loadBracketPage } from "@/lib/bracket-data";
import { getPageMetadata } from "@/lib/global-seo-settings";

type Params = Promise<{
  sport: string;
  division: string;
  year: string;
  week: string;
}>;

/** One week's projection, kept after newer weeks and the official field. */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, division, year, week } = await params;
  const model = await loadBracketPage({ sport, division, year, week });
  return getPageMetadata({
    title: bracketTitle(model.edition),
    description: bracketDescription(model.edition),
    slug: `/college/${sport}/playoffs/${division}/${year}/projections/${week}`,
  });
}

async function ProjectionBracket({ params }: { params: Params }) {
  const { sport, division, year, week } = await params;
  const model = await loadBracketPage({ sport, division, year, week });
  return <BracketPageView model={model} />;
}

export default function ProjectionBracketPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<BracketSkeleton />}>
      <ProjectionBracket params={params} />
    </Suspense>
  );
}
