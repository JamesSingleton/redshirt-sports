import { escapeHTML } from "@portabletext/to-html";
import { urlForJpeg } from "@redshirt-sports/sanity/client";
import type { RssFeedQueryResult } from "@redshirt-sports/sanity/types";
import { Feed } from "feed";
import { NextResponse } from "next/server";

import { getBaseUrl, getSiteEmailDomain } from "@/lib/get-base-url";
import { portableTextToHtml } from "@/lib/portable-text-to-html";
import type { RssFeedLink } from "@/lib/rss-feed-links";

type FeedPost = RssFeedQueryResult[number];

const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

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

function getContent(post: FeedPost, baseUrl: string) {
  const body = portableTextToHtml(post.body, baseUrl);
  // content:encoded also triggers the dc namespace used by dc:creator, so it must never be empty.
  return body || `<p>${escapeHTML(post.excerpt)}</p>`;
}

export function createRssResponse({
  feed: { path, title },
  description,
  pagePath,
  posts,
}: {
  feed: RssFeedLink;
  description: string;
  pagePath: string;
  posts: FeedPost[];
}) {
  const baseUrl = getBaseUrl();
  const appName = process.env.NEXT_PUBLIC_APP_NAME;
  const latestPublishedAt = posts[0]?.publishedAt;

  const feed = new Feed({
    title,
    id: `${baseUrl}${pagePath}`,
    link: `${baseUrl}${pagePath}`,
    description,
    language: "en",
    updated: latestPublishedAt ? new Date(latestPublishedAt) : undefined,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${appName}`,
    favicon: `${baseUrl}/favicon.ico`,
    image: `${baseUrl}/images/icons/RS_horizontal_513x512.png`,
    feedLinks: {
      rss: `${baseUrl}${path}`,
    },
    author: {
      name: `${appName}`,
      email: `contact@${getSiteEmailDomain()}`,
      link: baseUrl,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: post._id,
      link: `${baseUrl}/${post.slug}`,
      description: post.excerpt,
      content: getContent(post, baseUrl),
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

export function rssNotFound() {
  return new NextResponse("Feed not found", { status: 404 });
}
