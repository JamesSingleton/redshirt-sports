import "server-only";

import WeeklyDigestEmail, {
  type DigestArticle,
} from "@redshirt-sports/emails/weekly-digest";
import { client, urlForJpeg } from "@redshirt-sports/sanity/client";
import { queryNewsletterPosts } from "@redshirt-sports/sanity/queries";
import type { QueryNewsletterPostsResult } from "@redshirt-sports/sanity/types";
import { createElement } from "react";

import { getBaseUrl } from "@/lib/get-base-url";
import { broadcastOnce, RESEND_UNSUBSCRIBE_URL } from "./broadcast";
import type { NewsletterConfig } from "./config";
import { digestIssueKey, digestWeekLabel, digestWindow } from "./digest";
import { emailLogos } from "./email-logos";
import { DIGEST_TOPIC } from "./topics";

/** Longer than a week, so a key outlives the next issue's run. */
const ISSUE_KEY_TTL_SECONDS = 8 * 24 * 60 * 60;

const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

export type WeeklyDigestResult =
  | { status: "sent"; broadcastId: string; articles: number }
  | { status: "skipped"; reason: "no-articles" | "already-sent" }
  | { status: "failed"; error: string };

export function toDigestArticle(
  post: QueryNewsletterPostsResult[number],
  baseUrl: string,
): DigestArticle {
  const byline = post.authors.length
    ? `By ${listFormat.format(post.authors)}`
    : null;
  return {
    id: post._id,
    title: post.title,
    excerpt: post.excerpt,
    url: `${baseUrl}/${post.slug}`,
    imageUrl: post.image?.asset?._ref
      ? urlForJpeg(post.image).size(1120, 630).quality(80).url()
      : null,
    meta: [post.sport, byline].filter(Boolean).join(" · "),
  };
}

/**
 * The weekly issue: every article from the past seven days, sent as one
 * Resend broadcast to the newsletter segment. A week with no articles sends
 * nothing, and a second run on the same day sends nothing either.
 */
export async function sendWeeklyDigest(
  config: NewsletterConfig,
  now: Date,
): Promise<WeeklyDigestResult> {
  const window = digestWindow(now);
  const posts = await client
    .withConfig({ useCdn: false })
    .fetch(queryNewsletterPosts, window);
  const [lead] = posts;
  if (!lead) return { status: "skipped", reason: "no-articles" };

  const baseUrl = getBaseUrl();
  const weekLabel = digestWeekLabel(window.from);
  const articles = posts.map((post) => toDigestArticle(post, baseUrl));
  const result = await broadcastOnce(config, {
    key: digestIssueKey(now),
    ttlSeconds: ISSUE_KEY_TTL_SECONDS,
    topic: DIGEST_TOPIC,
    content: async () => ({
      name: `Weekly digest: week of ${weekLabel}`,
      subject: `This week at Redshirt Sports: ${lead.title}`,
      previewText: `${articles.length} ${articles.length === 1 ? "story" : "stories"} from the week of ${weekLabel}`,
      react: createElement(WeeklyDigestEmail, {
        weekLabel,
        siteUrl: baseUrl,
        articles,
        unsubscribeUrl: RESEND_UNSUBSCRIBE_URL,
        logo: (await emailLogos()).onDark,
      }),
    }),
  });
  return result.status === "sent"
    ? { ...result, articles: articles.length }
    : result;
}
