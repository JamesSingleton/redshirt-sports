import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeaderboardAd } from "@/components/ad-slot";
import {
  DivisionChips,
  FOOTBALL_DIVISION_CHIPS,
} from "@/components/news/division-chips";
import { NewsAside } from "@/components/news/news-aside";
import { NewsFeed } from "@/components/news/news-feed";
import { NewsLeadBlock } from "@/components/news/news-lead-block";
import { NewsPageHeader } from "@/components/news/news-page-header";
import type { StoryLike } from "@/components/news/story";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getSportFeed } from "@/lib/rss-feed-links";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const { perspective } = PUBLISHED_FETCH_OPTIONS;

  const { data: sportData } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!sportData?.title) {
    notFound();
  }

  const sportTitle = sportData.title;
  let title: string;
  let description: string;
  let canonicalUrl = `/college/${sport}/news`;

  if (pageIndex > 1) {
    title = `College ${sportTitle} News & Updates - Page ${pageIndex}`;
    description = `Continue exploring comprehensive college ${sportTitle} news, game analysis, and feature stories. This is page ${page} of our in-depth coverage.`;
    canonicalUrl = `${canonicalUrl}?page=${page}`;
  } else {
    title = `College ${sportTitle} News & Updates`;
    description = `Find comprehensive college ${sportTitle} news, detailed game results, expert analysis, and valuable insights. Your trusted source for NCAA ${sportTitle} information.`;
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
      rssFeeds: [getSportFeed({ slug: sport, title: sportTitle })],
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () =>
    renderSportNewsPage({ params, searchParams }),
  );
}

async function renderSportNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport }, { page }] = await Promise.all([params, searchParams]);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderSportNewsPage({
    sport,
    pageIndex,
    perspective,
    stega,
  });
}

async function cachedRenderSportNewsPage({
  sport,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { sport: string; pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [newsResponse, sportInfoResponse] = await Promise.all([
    sanityFetchPage({
      query: querySportsNews,
      params: { sport, from, to },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
      stega,
    }),
  ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse?.data;

  if (!news?.posts?.length) {
    notFound();
  }

  const totalPages = Math.ceil(news.totalPosts / perPage);

  const breadcrumbItems = [
    {
      title: "News",
      href: "/college/news",
    },
    {
      title: sportInfo!.title,
      href: `/college/${sport}/news`,
    },
  ];

  const stories = news.posts as StoryLike[];
  const isFirstPage = pageIndex <= 1;
  const leadStories = isFirstPage ? stories.slice(0, 4) : [];
  const listStories = isFirstPage ? stories.slice(4) : stories;
  const isFootball = sport === "football";

  return (
    <>
      <NewsPageHeader
        title={`College ${sportInfo?.title} News`}
        breadcrumbs={breadcrumbItems}
      />
      <div className="max-w-site mx-auto px-4 pb-12 lg:px-6">
        {isFootball ? (
          <DivisionChips
            chips={FOOTBALL_DIVISION_CHIPS}
            activeHref={`/college/${sport}/news`}
            className="pt-4"
          />
        ) : null}
        {leadStories.length > 0 ? (
          <div className="mt-5">
            <NewsLeadBlock stories={leadStories} />
          </div>
        ) : null}
        <LeaderboardAd />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {listStories.length > 0 ? (
            <NewsFeed
              stories={listStories}
              meta={`Page ${pageIndex} of ${totalPages}`}
              leadingPriorityCount={isFirstPage ? 0 : 2}
              pagination={
                totalPages > 1 ? (
                  <PaginationControls
                    totalPosts={news.totalPosts}
                    className="mt-0"
                  />
                ) : null
              }
            />
          ) : (
            <div />
          )}
          <NewsAside
            sport={sport}
            rankingsDivision={isFootball ? "fcs" : undefined}
          />
        </div>
      </div>
    </>
  );
}
