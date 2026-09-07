import {
  type DynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  queryGlobalSeoSettings,
} from "@redshirt-sports/sanity/queries";

import { getCachedNavbarLatestRankings } from "@/lib/rankings-data";

/**
 * Settings singleton as its own cache entry so navbar, footer, and metadata
 * share one fetch. Nested `"use cache"` tags propagate to callers.
 */
export async function getGlobalSettings({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryGlobalSeoSettings,
    perspective,
    stega,
  });
  return data;
}

/** Navbar Sanity + rankings data. Prefer this over a component-level `"use cache"`. */
export async function getNavigationData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [latestRankings, { data: navbarData }, settingsData] =
    await Promise.all([
      getCachedNavbarLatestRankings(),
      sanityFetch({
        query: globalNavigationQuery,
        perspective,
        stega,
      }),
      getGlobalSettings({ perspective, stega }),
    ]);

  return { navbarData, settingsData, latestRankings };
}
