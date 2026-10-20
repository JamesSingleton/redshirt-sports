import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  queryCollegeNews,
  queryCollegeNewsOldest,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { HomePost } from "@/components/home/home-page-content";
import { CollegeNewsArchiveFilters } from "@/components/news/college-news-archive-filters";
import { NewsArchiveHeader } from "@/components/news/news-archive-header";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import PaginationControls from "@/components/pagination-controls";
import { buildCollegeNewsFilterOptions } from "@/lib/college-news-filters";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import {
  type NewsArchiveSearchParams,
  parseNewsArchiveFilters,
} from "@/lib/news-archive";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import CollegeNewsRouteLoading from "./loading";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const pageIndex = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const { perspective } = PUBLISHED_FETCH_OPTIONS;

  let title: string;
  let description: string;
  let canonicalUrl = "/college/news";

  if (pageIndex > 1) {
    title = `College News - Page ${pageIndex}`;
    description = `Page ${pageIndex} of college sports news from ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    canonicalUrl = `${canonicalUrl}?page=${pageIndex}`;
  } else {
    title = "College News";
    description =
      "Every Redshirt story across college football and basketball, newest first.";
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
    },
    perspective,
  );
}

export default function CollegeNewsPage({
  searchParams,
}: {
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return searchParamsPage(<CollegeNewsRouteLoading />, () =>
    renderCollegeNewsPage(searchParams),
  );
}

async function renderCollegeNewsPage(
  searchParams: Promise<NewsArchiveSearchParams>,
) {
  const filters = await searchParams;
  const { pageIndex, search, storyType, sort } =
    parseNewsArchiveFilters(filters);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderCollegeNewsPage({
    pageIndex,
    search,
    storyType,
    sort,
    perspective,
    stega,
    filterParams: filters,
  });
}

async function cachedRenderCollegeNewsPage({
  pageIndex,
  search,
  storyType,
  sort,
  perspective,
  stega,
  filterParams,
}: DynamicFetchOptions & {
  pageIndex: number;
  search: string;
  storyType: string;
  sort: "newest" | "oldest";
  filterParams: NewsArchiveSearchParams;
}) {
  "use cache";
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const newsQuery =
    sort === "oldest" ? queryCollegeNewsOldest : queryCollegeNews;

  const queryParams = {
    from,
    to,
    search,
    storyType,
  };

  const [newsResponse, navResponse, mostRead, rankingsPolls] =
    await Promise.all([
      sanityFetchPage({
        query: newsQuery,
        params: queryParams,
        perspective,
        stega,
      }),
      sanityFetchPage({
        query: globalNavigationQuery,
        perspective,
        stega,
      }),
      getCachedMostReadPosts(),
      getCachedRankingsWidgetPolls(),
    ]);

  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
  } | null;

  if (!news?.posts?.length) {
    notFound();
  }

  const totalPages = Math.ceil((news.totalPosts ?? 0) / perPage);
  const { sports, divisions, conferences } = buildCollegeNewsFilterOptions(
    navResponse.data,
  );

  const breadcrumbItems = [
    { title: "College", href: "/college/news" },
    { title: "News", href: "/college/news" },
  ];

  return (
    <div className="mx-auto max-w-site px-4 lg:px-6">
      <NewsArchiveHeader
        breadcrumbs={breadcrumbItems}
        kicker="All sports · Archive"
        title="College News"
        description="Every Redshirt story across college football and basketball, newest first."
      />
      <CollegeNewsArchiveFilters
        sports={sports}
        divisions={divisions}
        conferences={conferences}
        initial={filterParams}
      />
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <NewsArchiveRiver
            posts={news.posts}
            pageIndex={pageIndex}
            totalPosts={news.totalPosts ?? news.posts.length}
            totalPages={totalPages}
            showSportLabels
          />
          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="pt-6">
              <PaginationControls totalPosts={news.totalPosts ?? 0} />
            </nav>
          ) : null}
        </div>
        <NewsArchiveSidebar mostRead={mostRead} rankingsPolls={rankingsPolls} />
      </div>
    </div>
  );
}
