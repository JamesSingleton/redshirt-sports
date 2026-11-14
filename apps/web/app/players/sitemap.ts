import { playerPath } from "@redshirt-sports/db/portal";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import { getCachedIndexablePlayers, portalIsPublic } from "@/lib/portal-data";

/**
 * Every player search engines may list: committed somewhere, not merged away.
 * Empty while the portal is hidden. One file holds 50,000 URLs; split with
 * `generateSitemaps` before the index gets near that.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!portalIsPublic()) return [];
  const base = getBaseUrl().replace(/\/$/, "");
  const players = await getCachedIndexablePlayers();
  return players.map((player) => ({
    url: `${base}${playerPath(player)}`,
    lastModified: player.publishedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
}
