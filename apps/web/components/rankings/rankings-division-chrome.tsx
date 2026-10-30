import { RankingsDivisionChromeClient } from "@/components/rankings/rankings-division-chrome-client";
import { loadRankingsDivisionShell } from "@/lib/rankings-week-shell";

export async function RankingsDivisionChrome({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  const { sport, division } = await params;
  const shell = await loadRankingsDivisionShell({ sport, division });

  return (
    <RankingsDivisionChromeClient
      sport={sport}
      sportLabel={shell.sportLabel}
      division={division}
      divisionName={shell.divisionName}
      rankingsIndexHref={shell.rankingsIndexHref}
      fallbackYear={String(shell.yearNumber)}
      fallbackWeekSegment={shell.weekSegment}
    />
  );
}
