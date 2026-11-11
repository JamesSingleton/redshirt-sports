import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const DISALLOW = [
  "/api/cron/",
  "/api/vote/",
  "/api/webhooks/",
  "/vote/",
  "/sign-in/",
  "/sign-up/",
  "/search/",
  "/onboarding/",
];

/**
 * AI crawlers that fetch pages to answer a user's question, and cite and link
 * the article. Allowed: they're how articles show up in AI answers.
 */
export const AI_ANSWER_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
];

/**
 * AI crawlers that collect pages to train models and send no readers back.
 * Blocked. Google-Extended and Applebot-Extended only control AI training;
 * Google Search and Apple search are unaffected.
 */
export const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      { userAgent: "*", allow: ["/"], disallow: DISALLOW },
      { userAgent: AI_ANSWER_CRAWLERS, allow: ["/"], disallow: DISALLOW },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: ["/"] },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,
      `${baseUrl}/rankings/sitemap.xml`,
      `${baseUrl}/ratings/sitemap.xml`,
      `${baseUrl}/playoffs/sitemap.xml`,
      `${baseUrl}/college/sitemap.xml`,
      `${baseUrl}/college/news/sitemap/0.xml`,
      `${baseUrl}/college/teams/sitemap.xml`,
    ],
  };
}
