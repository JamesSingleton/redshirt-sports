import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { rssFeedQuery } from "@redshirt-sports/sanity/queries";

import { createRssResponse } from "@/lib/rss-feed";
import { getSiteFeed } from "@/lib/rss-feed-links";

async function fetchPostsForFeed() {
  const { perspective } = await getDynamicFetchOptions();
  const { data } = await sanityFetchMetadata({
    query: rssFeedQuery,
    perspective,
  });
  return data ?? [];
}

export async function GET() {
  return createRssResponse({
    feed: getSiteFeed(),
    description:
      "Redshirt Sports covers college football and basketball at every level, from FBS to Division III, with our own Top 25, previews, recaps and projections.",
    pagePath: "/college/news",
    posts: await fetchPostsForFeed(),
  });
}
