import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { rssFeedQuery } from "@redshirt-sports/sanity/queries";

import { createRssResponse } from "@/lib/rss-feed";
import { getSiteFeed } from "@/lib/rss-feed-links";

async function fetchPostsForFeed() {
  "use cache";
  const { data } = await sanityFetchMetadata({
    query: rssFeedQuery,
    perspective: "published",
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
