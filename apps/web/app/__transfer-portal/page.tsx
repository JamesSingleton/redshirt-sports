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
  const slug =
    pageIndex > 1 ? `/transfer-portal?page=${pageIndex}` : "/transfer-portal";
  const settings = await fetchGlobalSeoSettings();

  return getSEOMetadata({
    title:
      pageIndex > 1
        ? `Transfer Portal News - Page ${pageIndex}`
        : "Transfer Portal News",
    description:
      "NCAA transfer portal news, entries, and analysis across college sports.",
    slug,
    articleSection: "transfer",
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
}

export default function TransferPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () => renderTransferPortalPage(searchParams));
}

async function renderTransferPortalPage(
  searchParams: Promise<{ page?: string }>,
) {
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderTransferPortalPage({ pageIndex, perspective, stega });
}

async function cachedRenderTransferPortalPage({
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { pageIndex: number }) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const { data } = await sanityFetchPage({
    query: postsByStoryTypeQuery,
    params: { storyType: "transfer", sport: "", from, to },
    perspective,
    stega,
  });

  return (
    <div className="container py-10">
      <PageHeader
        title="Transfer Portal"
        subtitle={
          <p className="text-muted-foreground mt-4 text-lg">
            Transfer portal news and analysis across college sports.
          </p>
        }
      />
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/transfer-portal/football/news"
          className="underline underline-offset-2"
        >
          Football transfer portal
        </Link>
        <Link
          href="/transfer-portal/mens-basketball/news"
          className="underline underline-offset-2"
        >
          Men&apos;s basketball transfer portal
        </Link>
      </div>
      <ArticleFeed articles={data?.posts ?? []} />
      {(data?.totalPosts ?? 0) > perPage && (
        <PaginationControls totalPosts={data?.totalPosts ?? 0} />
      )}
    </div>
  );
}
