import { loadRankingsWeekShell } from "@/lib/rankings-week-shell";

import { RankingsWeekChromeClient } from "@/components/rankings/rankings-week-chrome-client";

import { RankingsWeekChromeSkeleton } from "@/components/rankings/rankings-week-chrome-skeleton";

export async function RankingsWeekChrome({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}) {
  const { sport, division, year, week } = await params;
  const shell = await loadRankingsWeekShell({ sport, division, year, week });
  return <RankingsWeekChromeClient shell={shell} />;
}

export { RankingsWeekChromeSkeleton };
