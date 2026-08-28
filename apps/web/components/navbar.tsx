import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import type { StegaBranded } from "next-sanity";
import { memo } from "react";

import { getNavigationData } from "@/lib/navigation";
import { Logo } from "./logo";
import { NavbarClient, NavbarSkeletonResponsive } from "./navbar-client";

export interface RankingPeriod {
  division: string;
  week: number;
  year: number;
}

export type RankingPeriodOrUndefined = RankingPeriod | undefined;

export interface SportRankings {
  sport: string;
  divisions: RankingPeriodOrUndefined[];
}

export type Top25RankingsData = SportRankings[];

export async function DynamicNavbarServer() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedNavbarServer perspective={perspective} stega={stega} />;
}

export async function CachedNavbarServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  // Caching lives on `getNavigationData` / `getGlobalSettings` — a component-level
  // `"use cache"` here deadlocks under Cache Components when sibling boundaries
  // fill and Next's hang probe joins shared in-flight work from the outer render.
  const { navbarData, settingsData, latestRankings } = await getNavigationData({
    perspective,
    stega,
  });

  return (
    <MemoizedNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  );
}

// Memoize the main Navbar component to prevent unnecessary re-renders
const MemoizedNavbar = memo(function Navbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData | undefined;
}) {
  const { siteTitle: settingsSiteTitle, logo } = settingsData ?? {};

  return (
    <header className="py-3 md:border-b">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          {logo && <Logo alt={settingsSiteTitle} priority image={logo} />}
          <NavbarClient
            navbarData={navbarData}
            settingsData={settingsData}
            latestRankings={latestRankings || []}
          />
        </div>
      </div>
    </header>
  );
});

export { MemoizedNavbar as Navbar };

export function NavbarSkeleton() {
  return (
    <header className="h-[65px] py-4 md:border-b">
      <div className="container mx-auto px-4 md:px-6">
        <nav className="grid grid-cols-[auto_1fr] items-center gap-4">
          <div className="bg-muted h-[40px] w-[170px] animate-pulse rounded" />
          <NavbarSkeletonResponsive />
        </nav>
      </div>
    </header>
  );
}
