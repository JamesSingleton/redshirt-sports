"use client";

import { usePathname } from "next/navigation";

import { rankingsTabActiveFromPath } from "@/lib/rankings-tab-active";

import { RankingsTabs, type RankingsTabId } from "@/components/rankings/rankings-tabs";

export function RankingsTabsNav({
  tabs,
  active,
}: {
  tabs: {
    id: RankingsTabId;
    label: string;
    href: string;
  }[];
  active?: RankingsTabId;
}) {
  const pathname = usePathname();
  const resolvedActive = active ?? rankingsTabActiveFromPath(pathname);
  return <RankingsTabs tabs={tabs} active={resolvedActive} />;
}
