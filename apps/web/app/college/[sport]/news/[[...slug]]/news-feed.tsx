import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CollectionPage, ListItem, WithContext } from "schema-dts";

import ArticleFeed from "@/components/article-feed";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";

import { NewsFeedLoading } from "./loading";
import {
  fetchSportNewsForDivisionAndConference,
  fetchSportsAndDivisionNews,
  fetchSportsNews,
  type RouteMode,
} from "./news-data";

type BreadcrumbStop = { name: string; item: string };

function buildCollectionPageJsonLd({
  name,
  description,
  pageUrl,
  canonicalUrl,
  posts,
  totalPosts,
  baseUrl,
  breadcrumbStops,
}: {
  name: string;
  description: string;
  pageUrl: string;
  canonicalUrl: string;
  posts: Array<{ slug: string }>;
  totalPosts: number;
  baseUrl: string;
  breadcrumbStops: BreadcrumbStop[];
}): WithContext<CollectionPage> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: pageUrl,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map(
        (post, index): ListItem => ({
          "@type": "ListItem",
          "@id": `${baseUrl}/${post.slug}#article`,
          position: index + 1,
        }),
      ),
      numberOfItems: totalPosts,
      url: canonicalUrl,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        ...breadcrumbStops.map(
          (stop, i): ListItem => ({
            "@type": "ListItem",
            position: i + 2,
            name: stop.name,
            item: stop.item,
          }),
        ),
      ],
    },
  };
}

function PaginationFallback() {
  return <div className="mt-8 h-10" aria-hidden />;
}

export function NewsFeedSection({
  sport,
  routeMode,
  from,
  to,
}: {
  sport: string;
  routeMode: RouteMode;
  from: number;
  to: number;
}) {
  return (
    <Suspense fallback={<NewsFeedLoading />}>
      <NewsFeed sport={sport} routeMode={routeMode} from={from} to={to} />
    </Suspense>
  );
}

export function DivisionNewsSection({
  sport,
  division,
  from,
  to,
  pageQuery,
  baseUrl,
  breadcrumbStops,
  divisionName,
  sportTitle,
}: {
  sport: string;
  division: string;
  from: number;
  to: number;
  pageQuery?: string;
  baseUrl: string;
  breadcrumbStops: BreadcrumbStop[];
  divisionName: string | null | undefined;
  sportTitle: string | undefined;
}) {
  return (
    <Suspense fallback={<NewsFeedLoading />}>
      <DivisionNewsFeed
        sport={sport}
        division={division}
        from={from}
        to={to}
        pageQuery={pageQuery}
        baseUrl={baseUrl}
        breadcrumbStops={breadcrumbStops}
        divisionName={divisionName}
        sportTitle={sportTitle}
      />
    </Suspense>
  );
}

export function ConferenceNewsSection({
  sport,
  division,
  conference,
  from,
  to,
  pageQuery,
  baseUrl,
  breadcrumbStops,
  divisionName,
  sportTitle,
  conferenceName,
  pageTitle,
}: {
  sport: string;
  division: string;
  conference: string;
  from: number;
  to: number;
  pageQuery?: string;
  baseUrl: string;
  breadcrumbStops: BreadcrumbStop[];
  divisionName: string | null | undefined;
  sportTitle: string | undefined;
  conferenceName: string;
  pageTitle: string;
}) {
  return (
    <Suspense fallback={<NewsFeedLoading />}>
      <ConferenceNewsFeed
        sport={sport}
        division={division}
        conference={conference}
        from={from}
        to={to}
        pageQuery={pageQuery}
        baseUrl={baseUrl}
        breadcrumbStops={breadcrumbStops}
        divisionName={divisionName}
        sportTitle={sportTitle}
        conferenceName={conferenceName}
        pageTitle={pageTitle}
      />
    </Suspense>
  );
}

async function NewsFeed({
  sport,
  routeMode,
  from,
  to,
}: {
  sport: string;
  routeMode: RouteMode;
  from: number;
  to: number;
}) {
  if (routeMode.mode === "sport") {
    const { data: news } = await fetchSportsNews(sport, from, to);
    if (!news?.posts?.length) notFound();

    const totalPages = Math.ceil(news.totalPosts / perPage);

    return (
      <>
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<PaginationFallback />}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </>
    );
  }

  notFound();
}

async function DivisionNewsFeed({
  sport,
  division,
  from,
  to,
  pageQuery,
  baseUrl,
  breadcrumbStops,
  divisionName,
  sportTitle,
}: {
  sport: string;
  division: string;
  from: number;
  to: number;
  pageQuery?: string;
  baseUrl: string;
  breadcrumbStops: BreadcrumbStop[];
  divisionName: string | null | undefined;
  sportTitle: string | undefined;
}) {
  const { data: news } = await fetchSportsAndDivisionNews(
    sport,
    division,
    from,
    to,
  );
  if (!news?.posts?.length) notFound();

  const totalPages = Math.ceil(news.totalPosts / perPage);
  const canonicalUrl = `${baseUrl}/college/${sport}/news/${division}`;
  const jsonLd = buildCollectionPageJsonLd({
    name: `${divisionName} ${sportTitle} News`,
    description: `Stay informed with breaking ${divisionName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    pageUrl: `${canonicalUrl}${pageQuery ? `?page=${pageQuery}` : ""}`,
    canonicalUrl,
    posts: news.posts,
    totalPosts: news.totalPosts,
    baseUrl,
    breadcrumbStops,
  });

  return (
    <>
      <JsonLdScript
        data={jsonLd}
        id={`collection-page-${sport}-${division}`}
      />
      <ArticleFeed articles={news.posts} />
      {totalPages > 1 && (
        <Suspense fallback={<PaginationFallback />}>
          <PaginationControls totalPosts={news.totalPosts} />
        </Suspense>
      )}
    </>
  );
}

async function ConferenceNewsFeed({
  sport,
  division,
  conference,
  from,
  to,
  pageQuery,
  baseUrl,
  breadcrumbStops,
  divisionName,
  sportTitle,
  conferenceName,
  pageTitle,
}: {
  sport: string;
  division: string;
  conference: string;
  from: number;
  to: number;
  pageQuery?: string;
  baseUrl: string;
  breadcrumbStops: BreadcrumbStop[];
  divisionName: string | null | undefined;
  sportTitle: string | undefined;
  conferenceName: string;
  pageTitle: string;
}) {
  const { data: news } = await fetchSportNewsForDivisionAndConference(
    sport,
    division,
    conference,
    from,
    to,
  );

  if (!news?.posts?.length || !news.conferenceInfo) notFound();

  const totalPages = Math.ceil(news.totalPosts / perPage);
  const canonicalUrl = `${baseUrl}/college/${sport}/news/${division}/${conference}`;
  const jsonLd = buildCollectionPageJsonLd({
    name: pageTitle,
    description: `Stay informed with breaking ${conferenceName} ${divisionName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    pageUrl: `${canonicalUrl}${pageQuery ? `?page=${pageQuery}` : ""}`,
    canonicalUrl,
    posts: news.posts,
    totalPosts: news.totalPosts,
    baseUrl,
    breadcrumbStops,
  });

  return (
    <>
      <JsonLdScript
        data={jsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      <ArticleFeed articles={news.posts} />
      {totalPages > 1 && (
        <Suspense fallback={<PaginationFallback />}>
          <PaginationControls totalPosts={news.totalPosts} />
        </Suspense>
      )}
    </>
  );
}
