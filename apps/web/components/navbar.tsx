import { getLatestFinalRankingsBySportSlug } from "@redshirt-sports/db/queries";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import {
  queryGlobalSeoSettings,
  queryNavbarData,
} from "@redshirt-sports/sanity/queries";
import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@redshirt-sports/sanity/types";
import { memo } from "react";

import { resolveNavbarItems } from "@/lib/nav-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { Logo } from "./logo";
import type { Top25RankingsData } from "./nav-types";
import { NavbarClient, NavbarSkeletonResponsive } from "./navbar-client";

export type {
  RankingPeriod,
  SportRankings,
  Top25RankingsData,
} from "./nav-types";

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
    { data: settingsData },
    { data: navbarData },
    latestFootballRankings,
    latestMensBasketballRankings,
  ] = await Promise.all([
    sanityFetchPage({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryNavbarData,
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
      settingsData={settingsData}
      navbarData={navbarData}
      latestRankings={latestRankings}
    />
  );
}

// Memoize the main Navbar component to prevent unnecessary re-renders
const MemoizedNavbar = memo(function Navbar({
  settingsData,
  navbarData,
  latestRankings,
}: {
  settingsData: QueryGlobalSeoSettingsResult;
  navbarData: QueryNavbarDataResult;
  latestRankings: Top25RankingsData | undefined;
}) {
  const {
    siteTitle: settingsSiteTitle,
    logo,
    footerLogoDarkMode,
  } = settingsData ?? {};
  // The header is always a dark surface, so prefer the light/dark-mode logo.
  const headerLogo = footerLogoDarkMode ?? logo;
  const navItems = resolveNavbarItems(navbarData, latestRankings || []);

  return (
    <header className="bg-brand-surface text-brand-surface-foreground border-brand-surface-border sticky top-0 z-50 border-b">
      <div className="container px-4 py-3">
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          {headerLogo && (
            <Logo alt={settingsSiteTitle} priority image={headerLogo} />
          )}
          <NavbarClient settingsData={settingsData} navItems={navItems} />
        </div>
      </div>
    </header>
  );
});

export { MemoizedNavbar as Navbar };

export function NavbarSkeleton() {
  return (
    <header className="bg-brand-surface text-brand-surface-foreground border-brand-surface-border sticky top-0 z-50 h-[65px] border-b py-3">
      <div className="container px-4">
        <nav className="grid grid-cols-[auto_1fr] items-center gap-4">
          <div className="h-[40px] w-[170px] animate-pulse rounded bg-white/10" />
          <NavbarSkeletonResponsive />
        </nav>
      </div>
    </header>
  );
}
