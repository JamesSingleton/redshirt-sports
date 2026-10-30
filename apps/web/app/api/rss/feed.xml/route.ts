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
      "Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.",
    pagePath: "/college/news",
    posts: await fetchPostsForFeed(),
  });
}
