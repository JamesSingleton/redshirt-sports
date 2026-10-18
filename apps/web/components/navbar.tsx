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

import { getCachedNavbarLatestRankings } from "@/lib/rankings-data";
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

/**
 * Sanity chrome for the navbar. Separate from rankings so Content Lake
 * revalidation does not re-query Postgres for Top 25 week pointers.
 */
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

/**
 * Composer (no `"use cache"` here): runs two sibling cache scopes in parallel.
 * Nested `"use cache"` under a parent cache previously deadlocked the shared
 * postgres client while other Suspense boundaries filled.
 */
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
  const { siteTitle: settingsSiteTitle } = settingsData ?? {};

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="relative">
        <div className="max-w-site mx-auto flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-6">
          <Logo alt={settingsSiteTitle} priority />
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
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="relative">
        <div className="max-w-site mx-auto flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-6">
          <div className="bg-muted h-7 w-36 animate-pulse rounded lg:h-8 lg:w-44" />
          <NavbarSkeletonResponsive />
        </div>
      </div>
    </header>
  );
}
