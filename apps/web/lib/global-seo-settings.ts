import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";
import type { LivePerspective } from "next-sanity/live";

import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";

export async function fetchGlobalSeoSettings(
  perspective: LivePerspective = "published",
) {
  "use cache";
  const { data } = await sanityFetchMetadata({
    query: queryGlobalSeoSettings,
    perspective,
  });
  return data;
}
