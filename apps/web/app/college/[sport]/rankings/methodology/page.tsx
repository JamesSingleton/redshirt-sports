import { redirect } from "next/navigation";

import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getCachedLatestFinalRankingsBySportSlug } from "@/lib/rankings-data";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import type { SportParam } from "@/utils/espn";

export default function LegacyRankingsMethodologyRedirect({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  return draftAwareParamsPage(params, null, async ({ sport }) => {
    const sportParam = sport as SportParam;
    const divisions = await getCachedLatestFinalRankingsBySportSlug(sportParam);
    const primary = divisions[0];
    if (!primary) {
      redirect(`/college/${sport}/rankings`);
    }
    redirect(rankingsMethodologyHref(sport, primary.division));
  });
}
