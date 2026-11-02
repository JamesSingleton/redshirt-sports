import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import {
  getCachedPublicPools,
  getCachedRun,
  getCachedWeeks,
} from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH, ratingsPaths } from "@/lib/ratings/format";

/**
 * The shared methodology, then every public pool's latest page, accuracy, weekly
 * archives, and latest team sheets. Archived team sheets are noindex and left out.
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
    const run = await getCachedRun(pool.sportSlug, pool.slug, latest.runId);
    for (const row of run?.rows ?? []) {
      if (row.slug) {
        entries.push({
          url: `${base}${paths.team(row.slug)}`,
          lastModified: latest.publishedAt,
          priority: 0.5,
        });
      }
    }
  }
  return entries;
}
