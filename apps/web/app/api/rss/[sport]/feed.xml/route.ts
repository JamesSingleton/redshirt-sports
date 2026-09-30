import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import {
  rssFeedBySportQuery,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";

import { createRssResponse, rssNotFound } from "@/lib/rss-feed";
import { getSportFeed } from "@/lib/rss-feed-links";

async function fetchSportFeed(sport: string) {
  "use cache";
  const [{ data: sportInfo }, { data: posts }] = await Promise.all([
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective: "published",
    }),
    sanityFetchMetadata({
      query: rssFeedBySportQuery,
      params: { sport },
      perspective: "published",
    }),
  ]);
  return { sportTitle: sportInfo?.title, posts: posts ?? [] };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sport: string }> },
) {
  const { sport } = await params;
  const { sportTitle, posts } = await fetchSportFeed(sport);

  if (!sportTitle || !posts.length) {
    return rssNotFound();
  }

  return createRssResponse({
    feed: getSportFeed({ slug: sport, title: sportTitle }),
    description: `The latest college ${sportTitle} news, analysis, and features from ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    pagePath: `/college/${sport}/news`,
    posts,
  });
}
