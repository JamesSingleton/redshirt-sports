import { listPlayerSlugs } from "@redshirt-sports/db/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const players = await listPlayerSlugs(5000);
    return players.map(({ slug }) => ({
      url: `${baseUrl}/player/${slug}`,
      lastModified: new Date(),
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}
