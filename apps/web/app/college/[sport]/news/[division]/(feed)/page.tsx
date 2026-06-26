import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  queryDivisionOrSubgroupingDisplayName,
  querySportsAndDivisionNews,
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
import { fetchCollegeNewsDivisionLayoutData } from "@/lib/college-news-layout-data";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { sport, division: divisionParam } = await params;
  const division = resolveDivisionRouteSlug(divisionParam);
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = await getDynamicFetchOptions();
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
  const divisionName = divisionDisplayName.data?.displayName;

  if (!sportTitle || !divisionName) {
    notFound();
  }

  const baseTitle = `${divisionName} ${sportTitle} News, Updates & Analysis`;
  const baseDescription = getDivisionNewsDescription(
    division,
    divisionName,
    sportTitle,
  );

  const baseCanonical = `/college/${sport}/news/${division}`;
  const isFirstPage = !page || pageIndex <= 1;

  return getPageMetadata(
    {
      title: isFirstPage ? baseTitle : `${baseTitle} - Page ${pageIndex}`,
      description: isFirstPage
        ? baseDescription
        : `More ${divisionName} ${sportTitle} stories on Page ${pageIndex}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis.`,
      slug: isFirstPage ? baseCanonical : `${baseCanonical}?page=${pageIndex}`,
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(<CollegeNewsArticleListLoading />, () =>
    renderDivisionNewsFeed({ params, searchParams }),
  );
}

async function renderDivisionNewsFeed({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport, division: divisionParam }, { page }] = await Promise.all([
    params,
    searchParams,
  ]);
  const division = resolveDivisionRouteSlug(divisionParam);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedDivisionNewsFeed({
    sport,
    division,
    pageIndex,
    perspective,
    stega,
  });
}

async function cachedDivisionNewsFeed({
  sport,
  division,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  pageIndex: number;
}) {
  "use cache";
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [newsResponse, layoutData] = await Promise.all([
    sanityFetchPage({
      query: querySportsAndDivisionNews,
      params: { sport, division, from, to },
      perspective,
      stega,
    }),
    fetchCollegeNewsDivisionLayoutData({
      sport,
      division,
      perspective,
      stega,
    }),
  ]);

  const news = newsResponse.data;

  if (!news?.posts?.length || !layoutData) {
    notFound();
  }

  const { sportTitle, divisionName } = layoutData;
  const totalPages = Math.ceil(news.totalPosts / perPage);

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${divisionName} ${sportTitle} News`,
    description: getDivisionNewsDescription(division, divisionName, sportTitle),
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
          name: sportTitle,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: divisionName,
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
      ],
    },
  };

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}`}
      />
      <CollegeNewsArticleList articles={news.posts} />
      {totalPages > 1 ? (
        <PaginationControls totalPosts={news.totalPosts} />
      ) : null}
    </>
  );
}
