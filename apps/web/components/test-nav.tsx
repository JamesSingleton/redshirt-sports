import { getLatestFinalRankingsBySportSlug } from "@redshirt-sports/db/queries";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import {
  queryGlobalSeoSettings,
  queryNavbarData,
} from "@redshirt-sports/sanity/queries";

import { resolveNavbarItems } from "@/lib/nav-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";

import type { Top25RankingsData } from "./nav-types";
import { TestNavClient } from "./test-nav-client";

export async function DynamicTestNav() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedTestNav perspective={perspective} stega={stega} />;
}

export async function CachedTestNav({
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

  const navItems = resolveNavbarItems(navbarData, latestRankings);

  return (
    <TestNavClient settingsData={settingsData} navItems={navItems} />
  );
}

export async function TestNav() {
  return <CachedTestNav perspective="published" stega={false} />;
}
