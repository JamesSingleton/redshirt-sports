import type { RankingPeriod, Top25RankingsData } from "@/components/nav-types";

export interface NavLink {
  label: string;
  href: string;
  description?: string | null;
  openInNewTab?: boolean | null;
}

const divisionDisplayNames: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  naia: "NAIA",
  "power-conference": "Power Conference",
  "mid-major": "Mid-Major",
  "division-i": "Division I",
};

export function getDivisionDisplayName(division: string): string {
  return divisionDisplayNames[division] ?? division;
}

function formatRankingLabel(division: string, sportLabel: string): string {
  const divisionName = divisionDisplayNames[division] ?? division;
  if (sportLabel === "Football") {
    return `${divisionName} Football Rankings`;
  }
  return `${sportLabel} Top 25`;
}

export function buildRankingHref(
  sportSlug: string,
  ranking: RankingPeriod,
): string {
  const week = ranking.week === 999 ? "final-rankings" : String(ranking.week);
  return `/college/${sportSlug}/rankings/${ranking.division}/${ranking.year}/${week}`;
}

const sportLabels: Record<string, string> = {
  football: "Football",
  "mens-basketball": "Men's Basketball",
  "womens-basketball": "Women's Basketball",
};

/** Prefer live ranking periods from Postgres. */
export function resolveSportRankings(
  sportSlug: string,
  latestRankings: Top25RankingsData,
): NavLink[] {
  const live = latestRankings.find((s) => s.sport === sportSlug)?.divisions;
  const periods = live?.filter(
    (r): r is RankingPeriod => r != null && r.division != null,
  );

  if (!periods?.length) {
    return [];
  }

  const sportLabel = sportLabels[sportSlug] ?? sportSlug;

  return periods.map((ranking) => ({
    label: formatRankingLabel(ranking.division, sportLabel),
    href: buildRankingHref(sportSlug, ranking),
  }));
}
