import type { AdPlacementId } from "@redshirt-sports/sanity/ad-placements";
import type { SanityImageData } from "@redshirt-sports/sanity/image";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { queryPlacementAdvertisements } from "@redshirt-sports/sanity/queries";

import { sanityFetchRequestTime } from "@/lib/sanity-fetch";

export type AdvertisementCreative = {
  id: string;
  sponsorName: string;
  href: string;
  openInNewTab: boolean;
  image: SanityImageData;
};

/**
 * The sponsorship to show in one placement right now. Call it only from a
 * component that has awaited `connection()`: the dates are checked against
 * `now` on every request, so nothing here may be prerendered into a page.
 */
export async function loadAdvertisement({
  placement,
  sportSlugs = [],
  fetchOptions,
  now,
}: {
  placement: AdPlacementId;
  sportSlugs?: string[];
  fetchOptions: DynamicFetchOptions;
  now: Date;
}): Promise<AdvertisementCreative | null> {
  const result = await sanityFetchRequestTime({
    query: queryPlacementAdvertisements,
    params: { placement },
    ...fetchOptions,
  });

  const data =
    result && typeof result === "object" && "data" in result
      ? result.data
      : null;

  return pickAdvertisement(data, {
    now,
    sportSlugs,
    // Draft preview shows a flight before its start date.
    includeScheduled: fetchOptions.perspective !== "published",
  });
}

/**
 * First usable sponsorship from `queryPlacementAdvertisements` (already
 * ordered best first). One limited to sports shows only on a page for one of
 * them. One with no sports shows everywhere.
 */
export function pickAdvertisement(
  candidates: unknown,
  {
    now,
    sportSlugs,
    includeScheduled,
  }: { now: Date; sportSlugs: string[]; includeScheduled: boolean },
): AdvertisementCreative | null {
  if (!Array.isArray(candidates)) {
    return null;
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const record = candidate as Record<string, unknown>;

    const limitedTo = Array.isArray(record.sportSlugs) ? record.sportSlugs : [];
    if (
      limitedTo.length > 0 &&
      !limitedTo.some((slug) => sportSlugs.includes(slug))
    ) {
      continue;
    }

    if (
      !includeScheduled &&
      !isWithinFlight(record.startsAt, record.endsAt, now)
    ) {
      continue;
    }

    const creative = toAdvertisementCreative(record);
    if (creative) {
      return creative;
    }
  }

  return null;
}

function isWithinFlight(startsAt: unknown, endsAt: unknown, now: Date) {
  const time = now.getTime();
  if (typeof startsAt === "string" && Date.parse(startsAt) > time) {
    return false;
  }
  if (typeof endsAt === "string" && Date.parse(endsAt) < time) {
    return false;
  }
  return true;
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
