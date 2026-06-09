import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { postsByStoryTypeQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import Link from "next/link";

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
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const slug = pageIndex > 1 ? `/recruiting?page=${pageIndex}` : "/recruiting";
  const settings = await fetchGlobalSeoSettings();

  return getSEOMetadata({
    title:
      pageIndex > 1
        ? `College Recruiting News - Page ${pageIndex}`
        : "College Recruiting News",
    description:
      "High school recruiting news, commitments, and analysis across college sports.",
    slug,
    articleSection: "recruiting",
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
}

export default function RecruitingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () => renderRecruitingPage(searchParams));
}

async function renderRecruitingPage(searchParams: Promise<{ page?: string }>) {
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderRecruitingPage({ pageIndex, perspective, stega });
}

async function cachedRenderRecruitingPage({
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const { data } = await sanityFetchPage({
    query: postsByStoryTypeQuery,
    params: { storyType: "recruiting", sport: "", from, to },
    perspective,
    stega,
  });

  return (
    <div className="container py-10">
      <PageHeader
        title="Recruiting"
        subtitle={
          <p className="text-muted-foreground mt-4 text-lg">
            High school recruiting news and analysis across college sports.
          </p>
        }
      />
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/recruiting/football/news"
          className="underline underline-offset-2"
        >
          Football recruiting
        </Link>
        <Link
          href="/recruiting/mens-basketball/news"
          className="underline underline-offset-2"
        >
          Men&apos;s basketball recruiting
        </Link>
        <Link
          href="/recruiting/womens-basketball/news"
          className="underline underline-offset-2"
        >
          Women&apos;s basketball recruiting
        </Link>
      </div>
      <ArticleFeed articles={data?.posts ?? []} />
      {(data?.totalPosts ?? 0) > perPage && (
        <PaginationControls totalPosts={data?.totalPosts ?? 0} />
      )}
    </div>
  );
}
