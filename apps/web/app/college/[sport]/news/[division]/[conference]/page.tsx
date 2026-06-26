import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CollectionPage, WithContext } from "schema-dts";

import { CollegeNewsArticleList } from "@/components/college-news/college-news-article-list";
import { CollegeNewsArticleListLoading } from "@/components/college-news/college-news-loading";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import {
  getDivisionNewsDescription,
  resolveDivisionRouteSlug,
} from "@/lib/college-news-config";
import { fetchCollegeNewsConferenceLayoutData } from "@/lib/college-news-layout-data";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { sport, division: divisionParam, conference } = await params;
  const division = resolveDivisionRouteSlug(divisionParam);
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = await getDynamicFetchOptions();
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
  const canonical = `/college/${sport}/news/${division}/${conference}`;

  const baseTitle = `${conferenceName} ${divisionDisplayName.data.displayName} ${sportTitle.data.title} News, Updates & Analysis`;
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionDisplayName.data.displayName} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`;

  return getPageMetadata(
    {
      title: pageIndex > 1 ? `${baseTitle} - Page ${pageIndex}` : baseTitle,
      description:
        pageIndex > 1
          ? `Continue exploring coverage of ${conferenceName} ${divisionDisplayName.data.displayName} ${sportTitle.data.title} on Page ${pageIndex}.`
          : baseDescription,
      slug: pageIndex > 1 ? `${canonical}?page=${pageIndex}` : canonical,
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(<CollegeNewsArticleListLoading />, () =>
    renderConferenceNewsFeed({ params, searchParams }),
  );
}

async function renderConferenceNewsFeed({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport, division: divisionParam, conference }, { page }] =
    await Promise.all([params, searchParams]);
  const division = resolveDivisionRouteSlug(divisionParam);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedConferenceNewsFeed({
    sport,
    division,
    conference,
    pageIndex,
    perspective,
    stega,
  });
}

async function cachedConferenceNewsFeed({
  sport,
  division,
  conference,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  conference: string;
  pageIndex: number;
}) {
  "use cache";
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [newsResponse, layoutData] = await Promise.all([
    sanityFetchPage({
      query: queryArticlesBySportDivisionAndConference,
      params: { sport, division, conference, from, to },
      perspective,
      stega,
    }),
    fetchCollegeNewsConferenceLayoutData({
      sport,
      division,
      conference,
      perspective,
      stega,
    }),
  ]);

  const news = newsResponse.data;

  if (!news?.posts?.length || !news.conferenceInfo || !layoutData) {
    notFound();
  }

  const { sportTitle, divisionName, conferenceName } = layoutData;
  const pageTitle = `${conferenceName} ${sportTitle} News`;
  const totalPages = Math.ceil(news.totalPosts / perPage);

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: `Stay informed with breaking ${conferenceName} ${divisionName} ${sportTitle} news and in-depth analysis.`,
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
          name: sportTitle,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: divisionName,
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: conferenceName,
          item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
        },
      ],
    },
  };

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      <CollegeNewsArticleList articles={news.posts} />
      {totalPages > 1 ? (
        <PaginationControls totalPosts={news.totalPosts} />
      ) : null}
    </>
  );
}
