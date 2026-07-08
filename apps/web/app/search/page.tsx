import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { searchQuery } from "@redshirt-sports/sanity/queries";
import type { SearchQueryResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import Link from "next/link";

import { CollegeNewsArticleList } from "@/components/college-news/college-news-article-list";
import { CollegeNewsBreadcrumbs } from "@/components/college-news/college-news-breadcrumbs";
import { CollegeNewsArticleListLoading } from "@/components/college-news/college-news-loading";
import { CollegeNewsPageShell } from "@/components/college-news/college-news-page-shell";
import PaginationControls from "@/components/pagination-controls";
import Search from "@/components/search";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();
  return getPageMetadata(
    {
      title: `Search Results | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      description: `Explore the latest articles, news, and analysis on college sports. Find what you're looking for across FCS, FBS, D2, D3, and NAIA at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
      slug: "/search",
      noIndex: true,
    },
    perspective,
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  return searchParamsPage(<CollegeNewsArticleListLoading />, () =>
    renderSearchPage(searchParams),
  );
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
  const hasQuery = Boolean(query?.trim());
  const hasResults = searchResults.posts.length > 0;

  return (
    <CollegeNewsPageShell
      header={<CollegeNewsBreadcrumbs items={[{ label: "Search" }]} />}
      main={
        <>
          <header className="mb-6">
            <p className="text-xs font-bold tracking-widest text-primary uppercase">
              Search
            </p>
            <h1 className="mt-2 text-2xl font-black text-foreground leading-tight md:text-3xl">
              {hasQuery ? `Results for "${query}"` : "Search Articles"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {hasQuery
                ? `Found ${searchResults.totalPosts} ${searchResults.totalPosts === 1 ? "article" : "articles"} matching your search.`
                : "Search across news, analysis, recruiting, and transfer portal coverage from every division."}
            </p>
            <div className="mt-4 max-w-xl">
              <Search key={query ?? ""} defaultValue={query ?? ""} />
            </div>
          </header>

          {hasQuery && hasResults ? (
            <CollegeNewsArticleList articles={searchResults.posts} />
          ) : null}

          {hasQuery && !hasResults ? (
            <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
              <h2 className="text-lg font-bold text-foreground">
                No results found
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try different keywords or browse our latest coverage.
              </p>
              <Link
                href="/college/news"
                prefetch={false}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Browse college sports news
              </Link>
            </div>
          ) : null}

          {!hasQuery ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Enter a search term above to find articles across Redshirt
                Sports.
              </p>
            </div>
          ) : null}

          {hasQuery && totalPages > 1 ? (
            <PaginationControls totalPosts={searchResults.totalPosts} />
          ) : null}
        </>
      }
      sidebar={
        <aside aria-label="Sidebar" className="space-y-6">
          <div
            className="flex h-[250px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
            aria-hidden="true"
          >
            Advertisement
          </div>
        </aside>
      }
    />
  );
}
