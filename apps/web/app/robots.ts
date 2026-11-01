import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import {
  rankingsSitemapPath,
  sportsWithPublishedRankings,
} from "@/lib/rankings/sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = getBaseUrl();
  // One rankings sitemap per sport with a published poll; publishing a
  // sport's first poll expires the rankings cache and adds it here.
  const rankingsSports = await sportsWithPublishedRankings();

  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/api/cron/",
        "/api/vote/",
        "/api/webhooks/",
        "/vote/",
        "/sign-in/",
        "/sign-up/",
        "/search/",
        "/onboarding/",
      ],
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      ...rankingsSports.map(
        (sport) => `${baseUrl}${rankingsSitemapPath(sport)}`,
      ),
      `${baseUrl}/college/sitemap.xml`,
      `${baseUrl}/college/news/sitemap/0.xml`,
      `${baseUrl}/college/teams/sitemap.xml`,
    ],
  };
}
