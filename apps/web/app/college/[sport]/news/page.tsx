import {
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleFeed from "@/components/article-feed";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { searchParamsPage } from "@/lib/draft-cache";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/college/[sport]/news">): Promise<Metadata> {
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
    return {};
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

  return getSEOMetadata({
    title,
    description,
    slug: canonicalUrl,
  });
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/college/[sport]/news">) {
  return searchParamsPage(null, () =>
    renderSportNewsPage({ params, searchParams }),
  );
}

async function renderSportNewsPage({
  params,
  searchParams,
}: Pick<PageProps<"/college/[sport]/news">, "params" | "searchParams">) {
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

  return (
    <>
      <PageHeader
        title={`College ${sportInfo?.title} News`}
        breadcrumbs={breadcrumbItems}
      />
      <section className="container pb-12">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && <PaginationControls totalPosts={news.totalPosts} />}
      </section>
    </>
  );
}
