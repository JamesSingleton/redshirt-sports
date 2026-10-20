"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { RankingsBreadcrumb } from "@/components/rankings/rankings-breadcrumb";
import { RankingsTabsNav } from "@/components/rankings/rankings-tabs-nav";
import { buildRankingsTabsForPathname } from "@/lib/rankings-tabs-from-path";

export function RankingsDivisionChromeClient({
  sport,
  sportLabel,
  division,
  divisionName,
  rankingsIndexHref,
  fallbackYear,
  fallbackWeekSegment,
}: {
  sport: string;
  sportLabel: string;
  division: string;
  divisionName: string;
  rankingsIndexHref: string;
  fallbackYear: string;
  fallbackWeekSegment: string;
}) {
  const pathname = usePathname();
  const tabs = useMemo(
    () =>
      buildRankingsTabsForPathname(pathname, sport, division, {
        year: fallbackYear,
        weekSegment: fallbackWeekSegment,
      }),
    [pathname, sport, division, fallbackYear, fallbackWeekSegment],
  );

  return (
    <div className="pt-5">
      <RankingsBreadcrumb
        sport={sport}
        sportLabel={sportLabel}
        divisionName={divisionName}
        rankingsIndexHref={rankingsIndexHref}
      />
      <div className="mt-5">
        <RankingsTabsNav tabs={tabs} />
      </div>
    </div>
  );
}
