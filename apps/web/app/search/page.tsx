import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import { searchQuery } from "@redshirt-sports/sanity/queries";
import type { SearchQueryResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { StegaBranded } from "next-sanity";

import { NewsListing } from "@/components/news/news-listing";
import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { HeaderSearch } from "@/components/site-header/header-search";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "Search Results",
      description: `Explore the latest articles, news, and analysis on college football. Find what you're looking for across FCS, FBS, D2, D3, and NAIA at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
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
  let searchResults: StegaBranded<SearchQueryResult> = {
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

  const resultCount = searchResults.totalPosts;

  return (
    <PageTransition>
      <PageHeader
        title="Search"
        subtitle={
          query
            ? `${resultCount} ${resultCount === 1 ? "result" : "results"} for "${query}"`
            : "Search every story on Redshirt Sports."
        }
      >
        <HeaderSearch className="max-w-xl" defaultValue={query} />
      </PageHeader>
      <div className="container pb-12">
        {searchResults.posts.length > 0 ? (
          <NewsListing.Grid
            posts={searchResults.posts}
            totalPosts={searchResults.totalPosts}
          />
        ) : query ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>No stories match "{query}"</EmptyTitle>
              <EmptyDescription>
                Try a team, conference, or player name instead.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href="/college/news">Browse the latest news</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
      </div>
    </PageTransition>
  );
}
