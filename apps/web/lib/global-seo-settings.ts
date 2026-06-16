import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { LivePerspective } from "next-sanity/live";

import { getSEOMetadata, type PageMetadataInput } from "@/lib/seo";

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

export async function getPageMetadata(
  data: PageMetadataInput = {},
  perspective: LivePerspective = "published",
): Promise<Metadata> {
  const settings = await fetchGlobalSeoSettings(perspective);

  return getSEOMetadata({
    ...data,
    defaultOpenGraphImage:
      data.defaultOpenGraphImage ??
      settings?.defaultOpenGraphImage ??
      undefined,
    siteBrand: data.siteBrand ?? settings?.siteBrand ?? undefined,
  });
}
