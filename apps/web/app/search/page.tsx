import { searchQuery } from "@redshirt-sports/sanity/queries";
import type { SearchQueryResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";

import ArticleCard from "@/components/article-card";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import {
  getDynamicFetchOptions,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { searchParamsPage } from "@/lib/draft-cache";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: `Search Results | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Explore the latest articles, news, and analysis on college football. Find what you're looking for across FCS, FBS, D2, D3, and NAIA at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    slug: "/search",
  });
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  return searchParamsPage(null, () => renderSearchPage(searchParams));
}

async function renderSearchPage(
  searchParams: Promise<{ [key: string]: string }>,
) {
  const { q: query, page } = await searchParams;
  const pageIndex = page !== undefined ? Number.parseInt(page, 10) : 1;
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderSearchPage({ query, pageIndex, perspective, stega });
}

async function cachedRenderSearchPage({
  query,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { query?: string; pageIndex: number }) {
  "use cache";
  const subheadingText = query ? `Search results for "${query}"` : null;

  let searchResults: SearchQueryResult = {
    posts: [],
    totalPosts: 0,
  };

  if (query) {
    const from = (pageIndex - 1) * perPage;
    const to = pageIndex * perPage;
    const { data } = await sanityFetchPage({
      query: searchQuery,
      params: { q: query, from, to },
      perspective,
      stega,
    });
    searchResults = data;
  }

  const totalPages = Math.ceil(searchResults.totalPosts / perPage);

  return (
    <>
      <PageHeader title="Search Results" subtitle={subheadingText} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        {searchResults.posts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {searchResults.posts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                date={post.publishedAt}
                image={post.mainImage}
                slug={post.slug}
                author={post.authors[0]?.name ?? ""}
              />
            ))}
          </div>
        )}
        {searchResults.posts.length === 0 && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold">No results found.</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Try searching for something else or check out our latest articles
              below.
            </p>
          </div>
        )}
        {totalPages > 1 && (
          <PaginationControls totalPosts={searchResults.totalPosts} />
        )}
      </section>
    </>
  );
}
