import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";

import { RankingsWeekChromeClient } from "@/components/rankings/rankings-week-chrome-client";
import { RankingsWeekChromeSkeleton } from "@/components/rankings/rankings-week-chrome-skeleton";
import { loadRankingsWeekShell } from "@/lib/rankings-week-shell";

export async function RankingsWeekChrome({
  params,
  pinSelection = false,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
  /** See `RankingsWeekChromeClient`. */
  pinSelection?: boolean;
}) {
  const [{ sport, division, year, week }, fetchOptions] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const shell = await loadRankingsWeekShell({
    sport,
    division,
    year,
    week,
    fetchOptions,
  });
  return <RankingsWeekChromeClient shell={shell} pinSelection={pinSelection} />;
}

export { RankingsWeekChromeSkeleton };
