import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  queryDivisionConferenceFilters,
  queryDivisionOrSubgroupingDisplayName,
  querySportsAndDivisionNews,
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
import { getDivisionFeed, getSportFeed } from "@/lib/rss-feed-links";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ page?: string }>;
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
  const divisionName = divisionDisplayName.data?.displayName;

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
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () =>
    renderDivisionNewsPage({ params, searchParams }),
  );
}

async function renderDivisionNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ sport, division }, { page }] = await Promise.all([
    params,
    searchParams,
  ]);
  const pageIndex = validatePageIndex(page);
  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderDivisionNewsPage({
    sport,
    division,
    pageIndex,
    perspective,
    stega,
    aside: <PollAside sport={sport} division={division} />,
  });
}

async function cachedRenderDivisionNewsPage({
  sport,
  division,
  pageIndex,
  perspective,
  stega,
  aside,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
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
      query: querySportsAndDivisionNews,
      params: { sport, division, from, to },
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

  if (!news?.posts?.length) {
    notFound();
  }

  const sportTitle = sportInfo?.title;
  const divisionTitle = divisionOrSubgroupingName;

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
    {
      title: "News",
      href: "/college/news",
    },
    {
      title: sportInfo?.title,
      href: `/college/${sport}/news`,
    },
    {
      title: divisionOrSubgroupingName,
      href: `/college/${sport}/news/${division}`,
    },
  ];

  const basePath = `/college/${sport}/news/${division}`;
  const conferenceFilters = (conferenceFiltersResponse.data ?? []).map(
    (conference) => ({
      key: conference._id,
      label: conference.name ?? "",
      href: `${basePath}/${conference.slug}`,
    }),
  );

  return (
    <PageTransition>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}`}
      />
      <PageHeader
        title={`${divisionOrSubgroupingName} ${sportInfo?.title} News`}
        breadcrumbs={breadcrumbItems}
      >
        <FilterCombobox
          label="Conference"
          items={[
            { key: "all", label: "All", href: basePath },
            ...conferenceFilters,
          ]}
          activeHref={basePath}
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
