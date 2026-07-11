import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { postsByStoryTypeQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleFeed from "@/components/article-feed";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { requireSportBySlug } from "@/lib/sport-by-slug";
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
  const sportInfo = await requireSportBySlug(sport, perspective);
  const canonicalPath = `/college/${sport}/transfer-portal/news`;

  return getPageMetadata(
    {
      title:
        pageIndex > 1
          ? `${sportInfo.title} Transfer Portal News - Page ${pageIndex}`
          : `${sportInfo.title} Transfer Portal News`,
      description: `Transfer portal news and analysis for college ${sportInfo.title.toLowerCase()}.`,
      slug:
        pageIndex > 1 ? `${canonicalPath}?page=${pageIndex}` : canonicalPath,
    },
    perspective,
  );
}

export default function TransferPortalSportNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, async () => {
    const [{ sport }, { page }] = await Promise.all([params, searchParams]);
    const pageIndex = validatePageIndex(page);
    const { perspective, stega } = await getDynamicFetchOptions();

    return (
      <CachedTransferPortalSportNews
        sport={sport}
        pageIndex={pageIndex}
        perspective={perspective}
        stega={stega}
      />
    );
  });
}

async function CachedTransferPortalSportNews({
  sport,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { sport: string; pageIndex: number }) {
  "use cache";

  const sportInfo = await requireSportBySlug(sport, perspective);
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const { data } = await sanityFetchPage({
    query: postsByStoryTypeQuery,
    params: {
      storyType: "transfer",
      sport,
      from,
      to,
    },
    perspective,
    stega,
  });

  if (!data) {
    notFound();
  }

  const { posts, totalPosts } = data;

  return (
    <div className="container max-w-5xl px-4 py-8">
      <p className="mb-4 text-xs text-muted-foreground">
        <Link
          href="/college/transfer-portal/news"
          className="hover:text-foreground"
        >
          All Transfer Portal News
        </Link>
      </p>
      <PageHeader
        title={`${sportInfo.title} Transfer Portal News`}
        subtitle={`Transfer portal news and analysis for college ${sportInfo.title.toLowerCase()}.`}
      />
      <ArticleFeed articles={posts} />
      {totalPosts > perPage ? (
        <PaginationControls totalPosts={totalPosts} />
      ) : null}
    </div>
  );
}
