import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  queryDivisionOrSubgroupingDisplayName,
  rssFeedBySportAndDivisionQuery,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";

import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import { createRssResponse, rssNotFound } from "@/lib/rss-feed";
import { getDivisionFeed } from "@/lib/rss-feed-links";

async function fetchDivisionFeed(sport: string, division: string) {
  const { perspective } = await getDynamicFetchOptions();
  const [{ data: sportInfo }, { data: divisionInfo }, { data: posts }] =
    await Promise.all([
      sanityFetchMetadata({
        query: sportInfoBySlug,
        params: { slug: sport },
        perspective,
      }),
      sanityFetchMetadata({
        query: queryDivisionOrSubgroupingDisplayName,
        params: { slugOrShortName: division },
        perspective,
      }),
      sanityFetchMetadata({
        query: rssFeedBySportAndDivisionQuery,
        params: { sport, division },
        perspective,
      }),
    ]);
  return {
    sportTitle: sportInfo?.title,
    divisionName: (divisionInfo as DivisionDisplayMeta)?.displayName,
    posts: posts ?? [],
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  const { sport, division } = await params;
  const { sportTitle, divisionName, posts } = await fetchDivisionFeed(
    sport,
    division,
  );

  if (!sportTitle || !divisionName || !posts.length) {
    return rssNotFound();
  }

  return createRssResponse({
    feed: getDivisionFeed({
      sport: { slug: sport, title: sportTitle },
      division: { slug: division, name: divisionName },
    }),
    description: `The latest ${divisionName} ${sportTitle} news, analysis, and features from ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    pagePath: `/college/${sport}/news/${division}`,
    posts,
  });
}
