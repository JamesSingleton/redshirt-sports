import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { globalNavigationQuery } from "@redshirt-sports/sanity/queries";

import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function getCachedGlobalNavigation({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  return sanityFetchPage({
    query: globalNavigationQuery,
    perspective,
    stega,
  });
}
