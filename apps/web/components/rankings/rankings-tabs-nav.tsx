"use client";

import { usePathname } from "next/navigation";

import {
  type RankingsTabId,
  RankingsTabs,
} from "@/components/rankings/rankings-tabs";
import { rankingsTabActiveFromPath } from "@/lib/rankings-tab-active";

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
