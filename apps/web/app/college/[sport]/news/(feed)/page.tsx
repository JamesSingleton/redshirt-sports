import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollegeNewsArticleList } from "@/components/college-news/college-news-article-list";
import { CollegeNewsArticleListLoading } from "@/components/college-news/college-news-loading";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { getSportNewsDescription } from "@/lib/college-news-config";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
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
  const { perspective } = await getDynamicFetchOptions();

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
    description = getSportNewsDescription(sport, sportTitle);
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
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
  return searchParamsPage(<CollegeNewsArticleListLoading />, () =>
    renderSportNewsFeed({ params, searchParams }),
  );
}

async function renderSportNewsFeed({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport }, { page }] = await Promise.all([params, searchParams]);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedSportNewsFeed({
    sport,
    pageIndex,
    perspective,
    stega,
  });
}

async function cachedSportNewsFeed({
  sport,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { sport: string; pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const { data: news } = await sanityFetchPage({
    query: querySportsNews,
    params: { sport, from, to },
    perspective,
    stega,
  });

  if (!news?.posts?.length) {
    notFound();
  }

  const totalPages = Math.ceil(news.totalPosts / perPage);

  return (
    <>
      <CollegeNewsArticleList articles={news.posts} />
      {totalPages > 1 ? (
        <PaginationControls totalPosts={news.totalPosts} />
      ) : null}
    </>
  );
}
