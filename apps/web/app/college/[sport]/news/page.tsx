import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  querySportsNews,
  querySportsNewsOldest,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { HomePost } from "@/components/home/home-page-content";
import { NewsArchiveFilters } from "@/components/news/news-archive-filters";
import { NewsArchiveHeader } from "@/components/news/news-archive-header";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import {
  parseNewsArchiveFilters,
  type NewsArchiveSearchParams,
} from "@/lib/news-archive";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { getSportFeed } from "@/lib/rss-feed-links";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { buildSportNewsFilterOptions } from "@/lib/sport-news-filters";
import { sportNavLabel } from "@/lib/sport-nav";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport } = await params;
  const { page } = await searchParams;
  const pageIndex = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const { perspective } = PUBLISHED_FETCH_OPTIONS;

  const { data: sportData } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!sportData?.title) {
    notFound();
  }

  const sportLabel = sportNavLabel(sport, sportData.title);
  let title: string;
  let description: string;
  let canonicalUrl = `/college/${sport}/news`;

  if (pageIndex > 1) {
    title = `${sportLabel} News - Page ${pageIndex}`;
    description = `Page ${pageIndex} of ${sportLabel} news and analysis from ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    canonicalUrl = `${canonicalUrl}?page=${pageIndex}`;
  } else {
    title = `${sportLabel} News`;
    description = `Every ${sportLabel} story, newest first.`;
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
      rssFeeds: [getSportFeed({ slug: sport, title: sportData.title })],
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
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
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  const [{ sport }, filters] = await Promise.all([params, searchParams]);
  const { pageIndex, search, storyType, sort } =
    parseNewsArchiveFilters(filters);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderSportNewsPage({
    sport,
    pageIndex,
    search,
    storyType,
    sort,
    perspective,
    stega,
    filterParams: filters,
  });
}

async function cachedRenderSportNewsPage({
  sport,
  pageIndex,
  search,
  storyType,
  sort,
  perspective,
  stega,
  filterParams,
}: DynamicFetchOptions & {
  sport: string;
  pageIndex: number;
  search: string;
  storyType: string;
  sort: "newest" | "oldest";
  filterParams: NewsArchiveSearchParams;
}) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const newsQuery =
    sort === "oldest" ? querySportsNewsOldest : querySportsNews;

  const queryParams = {
    sport,
    from,
    to,
    search,
    storyType,
  };

  const [
    newsResponse,
    sportInfoResponse,
    navResponse,
    mostRead,
    rankingsPolls,
  ] = await Promise.all([
    sanityFetchPage({
      query: newsQuery,
      params: queryParams,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: globalNavigationQuery,
      perspective,
      stega,
    }),
    getCachedMostReadPosts(),
    getCachedRankingsWidgetPolls(),
  ]);

  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
  } | null;
  const sportInfo = sportInfoResponse?.data;

  if (!news?.posts?.length) {
    notFound();
  }

  const totalPages = Math.ceil((news.totalPosts ?? 0) / perPage);
  const sportLabel = sportNavLabel(sport, sportInfo?.title ?? sport);
  const { divisions, conferences } = buildSportNewsFilterOptions(
    sport,
    navResponse.data,
  );

  const breadcrumbItems = [
    { title: "College", href: "/college/news" },
    {
      title: sportInfo?.title ?? sport,
      href: `/college/${sport}/news`,
    },
    { title: "News", href: `/college/${sport}/news` },
  ];

  return (
    <div className="mx-auto max-w-site px-4 lg:px-6">
      <NewsArchiveHeader
        breadcrumbs={breadcrumbItems}
        title={`${sportLabel} News`}
        description={`Every ${sportLabel} story, newest first.`}
      />
      <NewsArchiveFilters
        sportSlug={sport}
        divisions={divisions}
        conferences={conferences}
        initial={filterParams}
      />
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <NewsArchiveRiver
            posts={news.posts}
            pageIndex={pageIndex}
            totalPosts={news.totalPosts ?? news.posts.length}
            totalPages={totalPages}
          />
          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="pt-6">
              <PaginationControls totalPosts={news.totalPosts ?? 0} />
            </nav>
          ) : null}
        </div>
        <NewsArchiveSidebar
          mostRead={mostRead}
          rankingsPolls={rankingsPolls}
        />
      </div>
    </div>
  );
}
