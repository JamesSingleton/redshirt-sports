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
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { getSEOMetadata } from "@/lib/seo";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchPage,
} from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export const revalidate = 604800;

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
    fetchGlobalSeoSettings(),
  ]);

  if (!sportData?.title) return {};

  let slug = `/recruiting/${sport}/news`;
  if (pageIndex > 1) slug += `?page=${pageIndex}`;

  return getSEOMetadata({
    title:
      pageIndex > 1
        ? `${sportData.title} Recruiting News - Page ${pageIndex}`
        : `${sportData.title} Recruiting News`,
    description: `Recruiting news and analysis for college ${sportData.title}.`,
    slug,
    articleSection: "recruiting",
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
}

export default async function RecruitingSportNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport }, { page }, fetchOptions] = await Promise.all([
    params,
    searchParams,
    getDynamicFetchOptions(),
  ]);
  const pageIndex = validatePageIndex(page);
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [{ data: sportData }, { data }] = await Promise.all([
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sport },
      ...fetchOptions,
    }),
    sanityFetchPage({
      query: postsByStoryTypeQuery,
      params: { storyType: "recruiting", sport, from, to },
      ...fetchOptions,
    }),
  ]);

  if (!sportData?.title) {
    notFound();
  }

  return (
    <div className="container py-10">
      <PageHeader
        title={`${sportData.title} Recruiting`}
        subtitle={
          <p className="text-muted-foreground mt-4 text-lg">
            Recruiting news and analysis for college {sportData.title}.
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
