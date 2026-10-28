import type { AdPlacementId } from "@redshirt-sports/sanity/ad-placements";
import type { SanityImageData } from "@redshirt-sports/sanity/image";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { queryActiveAdvertisement } from "@redshirt-sports/sanity/queries";

import { sanityFetchPage } from "@/lib/sanity-fetch";

export type AdvertisementCreative = {
  id: string;
  sponsorName: string;
  href: string;
  openInNewTab: boolean;
  image: SanityImageData;
};

export async function loadAdvertisement({
  placement,
  sportSlugs = [],
  fetchOptions,
}: {
  placement: AdPlacementId;
  sportSlugs?: string[];
  fetchOptions: DynamicFetchOptions;
}): Promise<AdvertisementCreative | null> {
  const result = await sanityFetchPage({
    query: queryActiveAdvertisement,
    params: {
      placement,
      sportSlugs,
      includeScheduled: fetchOptions.perspective !== "published",
    },
    ...fetchOptions,
  });

  const data =
    result && typeof result === "object" && "data" in result
      ? result.data
      : null;

  return toAdvertisementCreative(data);
}

export function toAdvertisementCreative(
  value: unknown,
): AdvertisementCreative | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const href = record.href;
  const sponsorName = record.sponsorName;
  const image = record.image;

  if (typeof href !== "string" || !isSafeAdHref(href)) {
    return null;
  }
  if (typeof sponsorName !== "string" || sponsorName.trim() === "") {
    return null;
  }
  if (!image || typeof image !== "object") {
    return null;
  }

  const imageRecord = image as Record<string, unknown>;
  const id = imageRecord.id;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }

  const alt =
    typeof imageRecord.alt === "string" && imageRecord.alt.trim() !== ""
      ? imageRecord.alt
      : `${sponsorName.trim()} advertisement`;

  return {
    id: typeof record._id === "string" ? record._id : id,
    sponsorName: sponsorName.trim(),
    href,
    openInNewTab: record.openInNewTab === true,
    image: {
      ...(image as SanityImageData),
      alt,
    },
  };
}

function isSafeAdHref(href: string): boolean {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
