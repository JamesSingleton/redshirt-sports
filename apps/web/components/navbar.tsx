import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  queryGlobalSeoSettings,
} from "@redshirt-sports/sanity/queries";
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import type { StegaBranded } from "next-sanity";
import { memo } from "react";

import { NavbarClient, NavbarSkeletonResponsive } from "@/components/navbar-client";
import { getCachedNavbarLatestRankings } from "@/lib/rankings-data";

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

async function getCachedNavbarSanity({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [{ data: navbarData }, { data: settingsData }] = await Promise.all([
    sanityFetch({
      query: globalNavigationQuery,
      perspective,
      stega,
    }),
    sanityFetch({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
  ]);
  return { navbarData, settingsData };
}

export async function CachedNavbarServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const [latestRankings, { navbarData, settingsData }] = await Promise.all([
    getCachedNavbarLatestRankings(),
    getCachedNavbarSanity({ perspective, stega }),
  ]);

  return (
    <MemoizedNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  );
}

const MemoizedNavbar = memo(function Navbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData | undefined;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="relative">
        <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
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
    <header className="sticky top-0 z-30 border-b bg-background/95">
      <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
        <div className="bg-muted h-7 w-[169px] animate-pulse rounded" />
        <NavbarSkeletonResponsive />
      </div>
    </header>
  );
}
