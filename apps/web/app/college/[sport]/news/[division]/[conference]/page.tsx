import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  queryDivisionConferenceFilters,
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { CollectionPage, WithContext } from "schema-dts";

import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import { FilterCombobox } from "@/components/news/filter-combobox";
import { NewsListing } from "@/components/news/news-listing";
import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { PollAside } from "@/components/rankings/poll-aside";
import { perPage } from "@/lib/constants";
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

  const baseTitle = `${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} News, Updates & Analysis`;
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`;

  let finalTitle = baseTitle;
  let finalDescription = baseDescription;

  if (pageIndex && pageIndex > 1) {
    finalTitle = `${baseTitle} - Page ${pageIndex}`;
    finalDescription = `Continue exploring coverage of ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} on Page ${pageIndex}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`;
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
  searchParams: Promise<{ page?: string }>;
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
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport, division, conference }, { page }] = await Promise.all([
    params,
    searchParams,
  ]);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderConferenceNewsPage({
    sport,
    division,
    conference,
    pageIndex,
    perspective,
    stega,
    aside: <PollAside sport={sport} division={division} />,
  });
}

async function cachedRenderConferenceNewsPage({
  sport,
  division,
  conference,
  pageIndex,
  perspective,
  stega,
  aside,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  conference: string;
  pageIndex: number;
  /** Postgres-backed; passed through so it stays out of this cache entry. */
  aside: ReactNode;
}) {
  "use cache";
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [
    newsResponse,
    sportInfoResponse,
    divisionNameResponse,
    conferenceFiltersResponse,
  ] = await Promise.all([
    sanityFetchPage({
      query: queryArticlesBySportDivisionAndConference,
      params: { sport, division, conference, from, to },
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
      query: queryDivisionConferenceFilters,
      params: { sport, division },
      perspective,
      stega: false,
    }),
  ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse.data;
  const divisionOrSubgroupingName = divisionNameResponse.data?.displayName;

  if (!news?.posts?.length || !news.conferenceInfo) {
    notFound();
  }

  const sportTitle = sportInfo?.title;

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} ${sportTitle} News`
    : `${news.conferenceInfo.name} ${sportTitle} News`;

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
    {
      title: "News",
      href: "/college/news",
    },
    {
      title: sportInfo?.title,
      href: `/college/${sport}/news`,
    },
    {
      title: divisionOrSubgroupingName || "",
      href: `/college/${sport}/news/${division}`,
    },
    {
      title: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
      href: `/college/${sport}/news/${division}/${conference}`,
    },
  ];

  const divisionPath = `/college/${sport}/news/${division}`;
  const conferenceFilters = (conferenceFiltersResponse.data ?? []).map(
    (item) => ({
      key: item._id,
      label: item.name ?? "",
      href: `${divisionPath}/${item.slug}`,
    }),
  );

  return (
    <PageTransition>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      <PageHeader title={title} breadcrumbs={breadcrumbItems}>
        <FilterCombobox
          label="Conference"
          items={[
            { key: "all", label: "All", href: divisionPath },
            ...conferenceFilters,
          ]}
          activeHref={`${divisionPath}/${conference}`}
        />
      </PageHeader>
      <NewsListing.Layout aside={aside}>
        <NewsListing.Feed
          posts={news.posts}
          totalPosts={news.totalPosts}
          pageIndex={pageIndex}
        />
      </NewsListing.Layout>
    </PageTransition>
  );
}
