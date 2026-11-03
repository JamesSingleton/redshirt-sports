import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

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
        // Ratings team sheets for every past week (128 teams × every week):
        // near-duplicates of the latest sheet that crawlers fetched ~9,500
        // times a day. The latest sheet (/ratings/{pool}/teams/{slug}) stays
        // open; `*` needs three path segments after /ratings/ to match.
        "/college/*/ratings/*/*/*/teams/",
        // Printable sheets for every team in a week (~5 MB, already noindex).
        "/college/*/ratings/*/*/*/team-sheets",
      ],
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/rankings/sitemap.xml`,
      `${baseUrl}/ratings/sitemap.xml`,
      `${baseUrl}/college/sitemap.xml`,
      `${baseUrl}/college/news/sitemap/0.xml`,
      `${baseUrl}/college/teams/sitemap.xml`,
    ],
  };
}
