import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import type { LivePerspective } from "next-sanity/live";
import { cache } from "react";

import { getSEOMetadata, type PageMetadataInput } from "@/lib/seo";

export const fetchGlobalSeoSettings = cache(
  async (perspective: LivePerspective = "published") => {
    const { data } = await sanityFetchMetadata({
      query: queryGlobalSeoSettings,
      perspective,
    });
    return data;
  },
);

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
