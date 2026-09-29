import { escapeHTML } from "@portabletext/to-html";
import { urlForJpeg } from "@redshirt-sports/sanity/client";
import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { rssFeedQuery } from "@redshirt-sports/sanity/queries";
import type { RssFeedQueryResult } from "@redshirt-sports/sanity/types";
import { Feed } from "feed";
import { NextResponse } from "next/server";

import { getBaseUrl, getSiteEmailDomain } from "@/lib/get-base-url";
import { portableTextToHtml } from "@/lib/portable-text-to-html";

type FeedPost = RssFeedQueryResult[number];

const baseUrl = getBaseUrl();
const emailDomain = getSiteEmailDomain();
const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

async function fetchPostsForFeed() {
  "use cache";
  const { data } = (await sanityFetchMetadata({
    query: rssFeedQuery,
    perspective: "published",
  })) as { data: RssFeedQueryResult | null };
  return data ?? [];
}

function getCategories(post: FeedPost) {
  const names = [
    post.sport,
    post.division,
    post.sportSubgrouping,
    ...(post.conferences ?? []).map(
      (conference) => conference.shortName || conference.name,
    ),
    ...(post.tags ?? []),
  ];
  const unique = new Set(names.filter((name): name is string => !!name));
  return [...unique].map((name) => ({ name }));
}

function getEnclosure(image: FeedPost["image"]) {
  if (!image?.asset?._ref) return undefined;
  return {
    url: urlForJpeg(image).size(1200, 675).quality(80).url(),
    type: "image/jpeg",
  };
}

function getContent(post: FeedPost) {
  const body = portableTextToHtml(post.body, baseUrl);
  // content:encoded also triggers the dc namespace used by dc:creator, so it must never be empty.
  return body || `<p>${escapeHTML(post.excerpt)}</p>`;
}

export async function GET() {
  const posts = await fetchPostsForFeed();
  const latestPublishedAt = posts[0]?.publishedAt;

  const feed = new Feed({
    title: `${process.env.NEXT_PUBLIC_APP_NAME}`,
    id: `${baseUrl}/college/news`,
    link: `${baseUrl}/college/news`,
    description:
      "Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.",
    language: "en",
    updated: latestPublishedAt ? new Date(latestPublishedAt) : undefined,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${process.env.NEXT_PUBLIC_APP_NAME}`,
    favicon: `${baseUrl}/favicon.ico`,
    image: `${baseUrl}/images/icons/RS_horizontal_513x512.png`,
    feedLinks: {
      rss: `${baseUrl}/api/rss/feed.xml`,
    },
    author: {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}`,
      email: `contact@${emailDomain}`,
      link: baseUrl,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: post._id,
      link: `${baseUrl}/${post.slug}`,
      description: post.excerpt,
      content: getContent(post),
      date: new Date(post.publishedAt),
      image: getEnclosure(post.image),
      category: getCategories(post),
      extensions: post.authors.length
        ? [
            {
              name: "dc:creator",
              objects: { _cdata: listFormat.format(post.authors) },
            },
          ]
        : undefined,
    });
  }

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
