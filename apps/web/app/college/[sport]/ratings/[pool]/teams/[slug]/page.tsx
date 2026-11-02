import type { Metadata } from "next";
import { Suspense } from "react";

import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { TeamSheetPage } from "@/components/ratings/team-sheet-page";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRatingsTeam } from "@/lib/ratings/data";
import { ratingsPaths } from "@/lib/ratings/format";

type Params = Promise<{ sport: string; pool: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool, slug } = await params;
  const { model, row } = await loadRatingsTeam({ sport, pool, slug });
  return getPageMetadata({
    title: `${row.name} Strength of Schedule & ${model.pool.name} Rating (${model.week.year})`,
    description: `${row.name}'s ${model.week.year} strength of schedule, strength of record, and power rating against ${model.pool.name} opponents, game by game.`,
    slug: ratingsPaths(sport, pool).team(slug),
  });
}

async function LatestTeam({ params }: { params: Params }) {
  const { sport, pool, slug } = await params;
  return <TeamSheetPage data={await loadRatingsTeam({ sport, pool, slug })} />;
}

export default function LatestTeamSheetPage(props: { params: Params }) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <LatestTeam {...props} />
    </Suspense>
  );
}
