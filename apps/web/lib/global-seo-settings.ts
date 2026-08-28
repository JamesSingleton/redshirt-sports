import type { Metadata } from "next";
import type { LivePerspective } from "next-sanity/live";

import { getGlobalSettings } from "@/lib/navigation";
import { getSEOMetadata, type PageMetadataInput } from "@/lib/seo";

/** Published/draft settings for metadata — shares the navbar/footer cache entry. */
export async function fetchGlobalSeoSettings(
  perspective: LivePerspective = "published",
) {
  return getGlobalSettings({ perspective, stega: false });
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
