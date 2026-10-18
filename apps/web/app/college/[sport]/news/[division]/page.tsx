import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
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

import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import {
  DivisionChips,
  FOOTBALL_DIVISION_CHIPS,
} from "@/components/news/division-chips";
import { NewsAside } from "@/components/news/news-aside";
import { NewsFeed } from "@/components/news/news-feed";
import { NewsPageHeader } from "@/components/news/news-page-header";
import type { StoryLike } from "@/components/news/story";
import PaginationControls from "@/components/pagination-controls";
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
  });
}

async function cachedRenderDivisionNewsPage({
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

  const [newsResponse, sportInfoResponse, divisionNameResponse] =
    await Promise.all([
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
    ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse.data;
  const divisionOrSubgroupingName = divisionNameResponse.data?.displayName;

  if (!news?.posts?.length) {
    notFound();
  }

  const sportTitle = sportInfo?.title;
  const divisionTitle = divisionOrSubgroupingName;

  const totalPages = Math.ceil(news.totalPosts / perPage);

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

  const stories = news.posts as StoryLike[];
  const isFootball = sport === "football";
  const pageStart = (pageIndex - 1) * perPage + 1;
  const pageEnd = Math.min(pageIndex * perPage, news.totalPosts);

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}`}
      />
      <NewsPageHeader
        title={`${divisionOrSubgroupingName} ${sportInfo?.title} News`}
        kicker={sportInfo?.title ? `College ${sportInfo.title}` : undefined}
        breadcrumbs={breadcrumbItems}
      />
      <div className="max-w-site mx-auto px-4 pb-12 lg:px-6">
        {isFootball ? (
          <DivisionChips
            chips={FOOTBALL_DIVISION_CHIPS}
            activeHref={`/college/${sport}/news/${division}`}
            className="pt-4"
          />
        ) : null}
        <div className="grid gap-8 pt-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <NewsFeed
            stories={stories}
            heading={pageIndex > 1 ? `Page ${pageIndex}` : "Latest"}
            meta={`Stories ${pageStart}–${pageEnd} of ${news.totalPosts}`}
            pagination={
              totalPages > 1 ? (
                <PaginationControls
                  totalPosts={news.totalPosts}
                  className="mt-0"
                />
              ) : null
            }
          />
          <NewsAside
            sport={sport}
            rankingsDivision={isFootball ? division : undefined}
          />
        </div>
      </div>
    </>
  );
}
