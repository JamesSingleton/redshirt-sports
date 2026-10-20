import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  queryDivisionOrSubgroupingDisplayName,
  querySportsAndDivisionNews,
  querySportsAndDivisionNewsOldest,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CollectionPage, WithContext } from "schema-dts";

import type { HomePost } from "@/components/home/home-page-content";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { DivisionConferencePicker } from "@/components/news/division-conference-picker";
import { NewsArchiveFilters } from "@/components/news/news-archive-filters";
import { NewsArchiveHeader } from "@/components/news/news-archive-header";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import {
  type NewsArchiveSearchParams,
  parseNewsArchiveFilters,
} from "@/lib/news-archive";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { getDivisionFeed, getSportFeed } from "@/lib/rss-feed-links";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { buildSportNewsFilterOptions } from "@/lib/sport-news-filters";
import { validateSport } from "@/lib/vote-ballot";
import { validatePageIndex } from "@/utils/validate-page-index";
import DivisionNewsRouteLoading from "./loading";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const [sportInfoResponse, divisionDisplayName] = await Promise.all([
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
    sanityFetchMetadata({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
    }),
  ]);

  const sportTitle = sportInfoResponse?.data?.title;
  const divisionName = (divisionDisplayName.data as DivisionDisplayMeta)
    ?.displayName;

  if (!sportTitle || !divisionName) {
    notFound();
  }

  const baseTitle = `${divisionName} ${sportTitle} News, Updates & Analysis`;
  const baseDescription = `Complete ${divisionName} ${sportTitle} coverage including breaking news, game analysis, player spotlights, and coaching updates. Your go-to source for ${sportTitle} insights.`;

  const baseCanonical = `/college/${sport}/news/${division}`;

  const isFirstPage = !page || pageIndex <= 1;

  let title: string;
  let description: string;
  let canonical: string;

  if (isFirstPage) {
    title = baseTitle;
    description = baseDescription;
    canonical = baseCanonical;
  } else {
    title = `${baseTitle} - Page ${pageIndex}`;
    description = `More ${divisionName} ${sportTitle} stories on Page ${pageIndex}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis.`;
    canonical = `${baseCanonical}?page=${pageIndex}`;
  }

  const sportFeedInput = { slug: sport, title: sportTitle };

  return getPageMetadata(
    {
      title,
      description,
      slug: canonical,
      rssFeeds: [
        getDivisionFeed({
          sport: sportFeedInput,
          division: { slug: division, name: divisionName },
        }),
        getSportFeed(sportFeedInput),
      ],
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return searchParamsPage(<DivisionNewsRouteLoading />, () =>
    renderDivisionNewsPage({ params, searchParams }),
  );
}

async function renderDivisionNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  const [{ sport, division }, filters] = await Promise.all([
    params,
    searchParams,
  ]);
  const { pageIndex, search, storyType, sort } =
    parseNewsArchiveFilters(filters);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderDivisionNewsPage({
    sport,
    division,
    pageIndex,
    search,
    storyType,
    sort,
    perspective,
    stega,
    filterParams: filters,
  });
}

async function cachedRenderDivisionNewsPage({
  sport,
  division,
  pageIndex,
  search,
  storyType,
  sort,
  perspective,
  stega,
  filterParams,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  pageIndex: number;
  search: string;
  storyType: string;
  sort: "newest" | "oldest";
  filterParams: NewsArchiveSearchParams;
}) {
  "use cache";
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const newsQuery =
    sort === "oldest"
      ? querySportsAndDivisionNewsOldest
      : querySportsAndDivisionNews;

  const queryParams = {
    sport,
    division,
    from,
    to,
    search,
    storyType,
  };

  const [
    newsResponse,
    sportInfoResponse,
    divisionNameResponse,
    navResponse,
    mostRead,
    rankingsPolls,
  ] = await Promise.all([
    sanityFetchPage({
      query: newsQuery,
      params: queryParams,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: globalNavigationQuery,
      perspective,
      stega,
    }),
    getCachedMostReadPosts(),
    getCachedRankingsWidgetPolls(validateSport(sport)),
  ]);

  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
  } | null;
  const sportInfo = sportInfoResponse.data;
  const divisionMeta = divisionNameResponse.data as DivisionDisplayMeta;
  const divisionOrSubgroupingName = divisionMeta?.displayName;
  const archiveKicker =
    divisionMeta?.archiveKicker ?? divisionOrSubgroupingName ?? "";

  if (!news?.posts?.length) {
    notFound();
  }

  const sportTitle = sportInfo?.title;
  const divisionTitle = divisionOrSubgroupingName;
  const totalPages = Math.ceil((news.totalPosts ?? 0) / perPage);
  const { divisions, conferences } = buildSportNewsFilterOptions(
    sport,
    navResponse.data,
  );

  const pageTitle = `${divisionOrSubgroupingName} ${sportInfo?.title} News`;

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${divisionTitle} ${sportTitle} News`,
    description: `Stay informed with breaking ${divisionOrSubgroupingName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}${pageIndex > 1 ? `?page=${pageIndex}` : ""}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: news.posts.map((post, index: number) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: news.totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "News",
          item: `${baseUrl}/college/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: sportTitle,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: divisionTitle || "",
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
      ],
    },
  };

  const breadcrumbItems = [
    { title: "College", href: "/college/news" },
    { title: sportInfo?.title ?? sport, href: `/college/${sport}/news` },
    { title: "News", href: `/college/${sport}/news` },
    {
      title: divisionOrSubgroupingName ?? division,
      href: `/college/${sport}/news/${division}`,
    },
  ];

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}`}
      />
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <NewsArchiveHeader
          breadcrumbs={breadcrumbItems}
          kicker={archiveKicker}
          title={pageTitle}
        >
          <DivisionConferencePicker
            sportSlug={sport}
            divisionSlug={division}
            divisionLabel={divisionOrSubgroupingName ?? division}
            conferences={conferences}
          />
        </NewsArchiveHeader>
        <NewsArchiveFilters
          variant="folder"
          sportSlug={sport}
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
            />
            {totalPages > 1 ? (
              <nav aria-label="Pagination" className="pt-6">
                <PaginationControls totalPosts={news.totalPosts ?? 0} />
              </nav>
            ) : null}
          </div>
          <NewsArchiveSidebar
            mostRead={mostRead}
            rankingsPolls={rankingsPolls}
          />
        </div>
      </div>
    </>
  );
}
