import { getLatestFinalRankingsBySportSlug } from "@redshirt-sports/db/queries";
import {
  globalNavigationQuery,
  queryGlobalSeoSettings,
} from "@redshirt-sports/sanity/queries";
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import { memo } from "react";

import { Logo } from "./logo";
import { NavbarClient, NavbarSkeletonResponsive } from "./navbar-client";
import {
  getDynamicFetchOptions,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { sanityFetchPage } from "@/lib/sanity-fetch";

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
  "use cache";
  const [
    { data: navbarData },
    { data: settingsData },
    latestFootballRankings,
    latestMensBasketballRankings,
  ] = await Promise.all([
    sanityFetchPage({
      query: globalNavigationQuery,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
    getLatestFinalRankingsBySportSlug("football"),
    getLatestFinalRankingsBySportSlug("mens-basketball"),
  ]);

  const latestRankings: Top25RankingsData = [
    {
      sport: "football",
      divisions: latestFootballRankings,
    },
    {
      sport: "mens-basketball",
      divisions: latestMensBasketballRankings,
    },
  ];

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
  navbarData: GlobalNavigationQueryResult;
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
