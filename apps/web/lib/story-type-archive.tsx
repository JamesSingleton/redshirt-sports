import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { postsByStoryTypeQuery } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleFeed from "@/components/article-feed";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

type StoryType = "recruiting" | "transfer";

interface StoryTypeArchiveConfig {
  storyType: StoryType;
  title: string;
  description: string;
  canonicalPath: string;
  sport?: string;
}

export function createStoryTypeArchivePage(config: StoryTypeArchiveConfig) {
  async function generateMetadata({
    searchParams,
  }: {
    searchParams: Promise<{ page?: string }>;
  }): Promise<Metadata> {
    const [params, { perspective }] = await Promise.all([
      searchParams,
      getDynamicFetchOptions(),
    ]);
    const pageNumber =
      typeof params.page === "string" ? parseInt(params.page, 10) : 1;
    const isFirstPage = !params.page || pageNumber <= 1;

    return getPageMetadata(
      {
        title: isFirstPage
          ? config.title
          : `${config.title} - Page ${pageNumber}`,
        description: config.description,
        slug: isFirstPage
          ? config.canonicalPath
          : `${config.canonicalPath}?page=${pageNumber}`,
      },
      perspective,
    );
  }

  function StoryTypeArchivePage({
    searchParams,
  }: {
    searchParams: Promise<{ page?: string }>;
  }) {
    return searchParamsPage(null, () => renderStoryTypeArchive(searchParams));
  }

  async function renderStoryTypeArchive(
    searchParams: Promise<{ page?: string }>,
  ) {
    const { page } = await searchParams;
    const pageIndex = validatePageIndex(page);
    const { perspective, stega } = await getDynamicFetchOptions();

    return (
      <CachedStoryTypeArchive
        pageIndex={pageIndex}
        perspective={perspective}
        stega={stega}
      />
    );
  }

  async function CachedStoryTypeArchive({
    pageIndex,
    perspective,
    stega,
  }: DynamicFetchOptions & { pageIndex: number }) {
    "use cache";

    const from = (pageIndex - 1) * perPage;
    const to = pageIndex * perPage;

    const { data } = await sanityFetchPage({
      query: postsByStoryTypeQuery,
      params: {
        storyType: config.storyType,
        sport: config.sport ?? "",
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
        <PageHeader title={config.title} subtitle={config.description} />
        <ArticleFeed articles={posts} />
        {totalPosts > perPage ? (
          <PaginationControls totalPosts={totalPosts} />
        ) : null}
      </div>
    );
  }

  return {
    generateMetadata,
    default: StoryTypeArchivePage,
  };
}
