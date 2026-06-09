import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  postsByStoryTypeQuery,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleFeed from "@/components/article-feed";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const [{ sport }, { page }, { perspective }] = await Promise.all([
    params,
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const pageIndex = validatePageIndex(page);

  const [{ data: sportData }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
    fetchGlobalSeoSettings(perspective),
  ]);

  if (!sportData?.title) return {};

  let slug = `/transfer-portal/${sport}/news`;
  if (pageIndex > 1) slug += `?page=${pageIndex}`;

  return getSEOMetadata({
    title:
      pageIndex > 1
        ? `${sportData.title} Transfer Portal - Page ${pageIndex}`
        : `${sportData.title} Transfer Portal`,
    description: `Transfer portal news for college ${sportData.title}.`,
    slug,
    articleSection: "transfer",
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
}

export default function TransferPortalSportNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () =>
    renderTransferPortalSportNewsPage({ params, searchParams }),
  );
}

async function renderTransferPortalSportNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport }, { page }] = await Promise.all([params, searchParams]);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderTransferPortalSportNewsPage({
    sport,
    pageIndex,
    perspective,
    stega,
  });
}

async function cachedRenderTransferPortalSportNewsPage({
  sport,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { sport: string; pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [{ data: sportData }, { data }] = await Promise.all([
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: postsByStoryTypeQuery,
      params: { storyType: "transfer", sport, from, to },
      perspective,
      stega,
    }),
  ]);

  if (!sportData?.title) {
    notFound();
  }

  return (
    <div className="container py-10">
      <PageHeader
        title={`${sportData.title} Transfer Portal`}
        subtitle={
          <p className="text-muted-foreground mt-4 text-lg">
            Transfer portal news for college {sportData.title}.
          </p>
        }
      />
      <ArticleFeed articles={data?.posts ?? []} />
      {(data?.totalPosts ?? 0) > perPage && (
        <PaginationControls totalPosts={data?.totalPosts ?? 0} />
      )}
    </div>
  );
}
