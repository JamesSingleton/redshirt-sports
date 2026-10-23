import type { RankingsTabId } from "@/components/rankings/rankings-tabs";

export function rankingsMethodologyHref(sport: string, division: string) {
  return `/college/${sport}/rankings/${division}/methodology`;
}

export function rankingsWeekPath(
  sport: string,
  division: string,
  year: string,
  weekSegment: string,
) {
  return `/college/${sport}/rankings/${division}/${year}/${weekSegment}`;
}

export function buildRankingsTabs({
  sport,
  division,
  year,
  weekSegment,
}: {
  sport: string;
  division: string;
  year: string;
  weekSegment: string;
}) {
  const weekPath = rankingsWeekPath(sport, division, year, weekSegment);
  const ballotsHref = `${weekPath}/ballots`;
  return [
    { id: "poll" as const, label: "Poll", href: weekPath },
    { id: "ballots" as const, label: "Ballots", href: ballotsHref },
    {
      id: "voters" as const,
      label: "Voters",
      href: `/college/${sport}/rankings/${division}/voters`,
    },
    {
      id: "history" as const,
      label: "History",
      href: `/college/${sport}/rankings/${division}/history`,
    },
    {
      id: "methodology" as const,
      label: "Methodology",
      href: rankingsMethodologyHref(sport, division),
    },
  ];
}

export function rankingsTabHrefForActive(
  tabs: ReturnType<typeof buildRankingsTabs>,
  active: RankingsTabId,
) {
  return tabs.find((tab) => tab.id === active)?.href ?? tabs[0]?.href ?? "/";
}
