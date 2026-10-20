import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  globalNavigationQuery,
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  queryArticlesBySportDivisionAndConferenceOldest,
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CollectionPage, WithContext } from "schema-dts";

import type { HomePost } from "@/components/home/home-page-content";
import { DivisionConferencePicker } from "@/components/news/division-conference-picker";
import { NewsArchiveFilters } from "@/components/news/news-archive-filters";
import { NewsArchiveHeader } from "@/components/news/news-archive-header";
import { NewsArchiveRiver } from "@/components/news/news-archive-river";
import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import {
  parseNewsArchiveFilters,
  type NewsArchiveSearchParams,
} from "@/lib/news-archive";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { buildSportNewsFilterOptions } from "@/lib/sport-news-filters";
import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport, division, conference } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const [divisionDisplayName, conferenceInfo, sportTitle] = await Promise.all([
    sanityFetchMetadata({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
    }),
    sanityFetchMetadata({
      query: conferenceInfoBySlugQuery,
      params: { slug: conference },
      perspective,
    }),
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
  ]);

  if (
    !conferenceInfo ||
    !sportTitle.data?.title ||
    !divisionDisplayName?.data
  ) {
    notFound();
  }

  const conferenceName =
    conferenceInfo.data?.shortName ?? conferenceInfo.data?.name;
  let canonical = `/college/${sport}/news/${division}/${conference}`;

  const divisionLabel = (divisionDisplayName?.data as DivisionDisplayMeta)
    ?.displayName;
  const baseTitle = `${conferenceName} ${divisionLabel} ${sportTitle.data.title} News, Updates & Analysis`;
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionLabel} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`;

  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageIndex && pageIndex > 1) {
    finalTitle = `${baseTitle} - Page ${pageIndex}`;
    finalDescription = `Continue exploring coverage of ${conferenceName} ${divisionLabel} ${sportTitle.data.title} on Page ${pageIndex}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    canonical = `/college/${sport}/news/${division}/${conference}?page=${pageIndex}`;
  }

  return getPageMetadata(
    {
      title: finalTitle,
      description: finalDescription,
      slug: canonical,
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return searchParamsPage(null, () =>
    renderConferenceNewsPage({ params, searchParams }),
  );
}

async function renderConferenceNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  const [{ sport, division, conference }, filters] = await Promise.all([
    params,
    searchParams,
  ]);
  const { pageIndex, search, storyType, sort } =
    parseNewsArchiveFilters(filters);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderConferenceNewsPage({
    sport,
    division,
    conference,
    pageIndex,
    search,
    storyType,
    sort,
    perspective,
    stega,
    filterParams: filters,
  });
}

async function cachedRenderConferenceNewsPage({
  sport,
  division,
  conference,
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
  conference: string;
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
      ? queryArticlesBySportDivisionAndConferenceOldest
      : queryArticlesBySportDivisionAndConference;

  const queryParams = {
    sport,
    division,
    conference,
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
    getCachedRankingsWidgetPolls(),
  ]);

  const news = newsResponse.data as {
    posts?: HomePost[];
    totalPosts?: number;
    conferenceInfo?: {
      name: string;
      shortName?: string | null;
    } | null;
  } | null;
  const sportInfo = sportInfoResponse.data;
  const divisionMeta = divisionNameResponse.data as DivisionDisplayMeta;
  const divisionOrSubgroupingName = divisionMeta?.displayName;
  const archiveKicker =
    divisionMeta?.archiveKicker ?? divisionOrSubgroupingName ?? "";

  if (!news?.posts?.length || !news.conferenceInfo) {
    notFound();
  }

  const totalPages = Math.ceil((news.totalPosts ?? 0) / perPage);
  const sportTitle = sportInfo?.title;

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} ${sportTitle} News`
    : `${news.conferenceInfo.name} ${sportTitle} News`;

  const { divisions, conferences } = buildSportNewsFilterOptions(
    sport,
    navResponse.data,
  );

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: `Stay informed with breaking ${news.conferenceInfo.shortName ?? news.conferenceInfo.name} ${divisionOrSubgroupingName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}/${conference}${pageIndex > 1 ? `?page=${pageIndex}` : ""}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: news.posts.map((post, index: number) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: news.totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
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
          name: divisionOrSubgroupingName || "",
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
          item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
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
    {
      title:
        news.conferenceInfo.shortName ?? news.conferenceInfo.name ?? conference,
      href: `/college/${sport}/news/${division}/${conference}`,
    },
  ];

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      <div className="mx-auto max-w-site px-4 lg:px-6">
        <NewsArchiveHeader
          breadcrumbs={breadcrumbItems}
          kicker={archiveKicker}
          title={title}
        >
          <DivisionConferencePicker
            sportSlug={sport}
            divisionSlug={division}
            divisionLabel={divisionOrSubgroupingName ?? division}
            conferences={conferences}
            activeConferenceSlug={conference}
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
