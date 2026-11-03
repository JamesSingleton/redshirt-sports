import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import { getCachedPublicPools, getCachedWeeks } from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH, ratingsPaths } from "@/lib/ratings/format";

/**
 * The shared methodology, then every public pool's latest page, accuracy, and
 * weekly archives. Team sheets are noindex; each team's ratings live on its team page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl().replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [];
  const pools = await getCachedPublicPools();
  if (pools.length > 0) {
    entries.push({ url: `${base}${RATINGS_METHODOLOGY_PATH}`, priority: 0.6 });
  }
  for (const pool of pools) {
    const weeks = await getCachedWeeks(pool.sportSlug, pool.slug, pool.id);
    const latest = weeks[0];
    if (!latest) continue;
    const paths = ratingsPaths(pool.sportSlug, pool.slug);
    entries.push(
      {
        url: `${base}${paths.latest}`,
        lastModified: latest.publishedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      { url: `${base}${paths.accuracy}`, priority: 0.5 },
    );
    for (const week of weeks) {
      entries.push({
        url: `${base}${paths.week(week.year, week.segment)}`,
        lastModified: week.publishedAt,
        priority: 0.6,
      });
    }
  }
  return entries;
}
