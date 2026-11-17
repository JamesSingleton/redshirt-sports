import { PORTAL_SPORT_SLUGS } from "@redshirt-sports/db/portal";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import {
  getCachedPortalCycles,
  portalIsPublic,
  portalWirePath,
} from "@/lib/portal-data";

/**
 * The portal hub, then each sport's transfer portal tracker: the current cycle at its bare URL,
 * then every past cycle with published moves. Empty while the portal is hidden.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!portalIsPublic()) return [];
  const base = getBaseUrl().replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/transfer-portal`, changeFrequency: "daily", priority: 0.9 },
  ];
  for (const sport of PORTAL_SPORT_SLUGS) {
    const { cycles, current } = await getCachedPortalCycles(sport);
    entries.push({
      url: `${base}${portalWirePath(sport)}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
    for (const year of cycles) {
      if (year === current) continue;
      entries.push({
        url: `${base}${portalWirePath(sport, year)}`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
  }
  return entries;
}
