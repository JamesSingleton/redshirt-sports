import {
  type DynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import type { StegaBranded } from "next-sanity";
import { memo } from "react";

import {
  NavbarClient,
  NavbarSkeletonResponsive,
} from "@/components/navbar-client";
import { getCachedGlobalNavigation } from "@/lib/news-archive/cached-global-navigation";
import { getCachedNavbarLatestRankings } from "@/lib/rankings-data";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

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
  return <CachedNavbarServer {...(await resolveDynamicFetchOptions())} />;
}

async function getCachedNavbarSanity({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [navResponse, { data: settingsData }] = await Promise.all([
    getCachedGlobalNavigation({ perspective, stega }),
    sanityFetch({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
  ]);
  return { navbarData: navResponse.data, settingsData };
}

export async function CachedNavbarServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const { navbarData, settingsData } = await getCachedNavbarSanity({
    perspective,
    stega,
  });
  const latestRankingsPromise = getCachedNavbarLatestRankings();

  return (
    <MemoizedNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankingsPromise={latestRankingsPromise}
    />
  );
}

const MemoizedNavbar = memo(function Navbar({
  navbarData,
  settingsData,
  latestRankings,
  latestRankingsPromise,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings?: Top25RankingsData;
  latestRankingsPromise?: Promise<Top25RankingsData>;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="relative">
        <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
          <NavbarClient
            navbarData={navbarData}
            settingsData={settingsData}
            latestRankings={latestRankings}
            latestRankingsPromise={latestRankingsPromise}
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
