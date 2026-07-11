import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const RANKINGS_SPORTS = ["football", "mens-basketball", "womens-basketball"];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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
      `${baseUrl}/college/sitemap.xml`,
      `${baseUrl}/college/news/sitemap/0.xml`,
      `${baseUrl}/college/teams/sitemap.xml`,
      `${baseUrl}/player/sitemap.xml`,
      ...RANKINGS_SPORTS.map(
        (sport) => `${baseUrl}/college/${sport}/rankings/sitemap/0.xml`,
      ),
    ],
  };
}
