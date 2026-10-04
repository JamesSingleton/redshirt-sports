import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  querySportDivisionFilters,
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FilterRow } from "@/components/news/filter-row";
import { NewsListing } from "@/components/news/news-listing";
import { NewsListingSkeleton } from "@/components/news/news-listing-skeleton";
import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { PollAside } from "@/components/rankings/poll-aside";
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
  return searchParamsPage(<NewsListingSkeleton />, () =>
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
    aside: <PollAside sport={sport} />,
  });
}

async function cachedRenderSportNewsPage({
  sport,
  pageIndex,
  perspective,
  stega,
  aside,
}: DynamicFetchOptions & {
  sport: string;
  pageIndex: number;
  /** Postgres-backed; passed through so it stays out of this cache entry. */
  aside: ReactNode;
}) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [newsResponse, sportInfoResponse, divisionFiltersResponse] =
    await Promise.all([
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
      sanityFetchPage({
        query: querySportDivisionFilters,
        params: { sport },
        perspective,
        stega: false,
      }),
    ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse?.data;

  if (!news?.posts?.length) {
    notFound();
  }

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

  const basePath = `/college/${sport}/news`;
  const { subgroupings = [], divisions = [] } =
    divisionFiltersResponse.data ?? {};
  const divisionFilters = [...subgroupings, ...divisions].map((item) => ({
    key: item._id,
    label: item.name ?? "",
    href: `${basePath}/${item.slug}`,
  }));

  return (
    <PageTransition>
      <PageHeader
        title={`College ${sportInfo?.title} News`}
        breadcrumbs={breadcrumbItems}
      >
        <FilterRow
          label="Divisions"
          items={[
            { key: "all", label: "All", href: basePath },
            ...divisionFilters,
          ]}
          activeHref={basePath}
        />
      </PageHeader>
      <NewsListing.Layout aside={aside}>
        <NewsListing.Feed
          posts={news.posts}
          totalPosts={news.totalPosts}
          pageIndex={pageIndex}
        />
      </NewsListing.Layout>
    </PageTransition>
  );
}
