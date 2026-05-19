import { sanityFetch } from "@redshirt-sports/sanity/live";
import {
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  queryDivisionOrSubgroupingDisplayName,
  querySportsAndDivisionNews,
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import type { CollectionPage, ListItem, WithContext } from "schema-dts";

import ArticleFeed from "@/components/article-feed";
import { JsonLdScript, organizationId, websiteId } from "@/components/json-ld";
import PageHeader from "@/components/page-header";
import PaginationControls from "@/components/pagination-controls";
import { perPage } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";
import { validatePageIndex } from "@/utils/validate-page-index";

// ── Route config ──────────────────────────────────────────────────────────────

// Do NOT set `export const revalidate` here.
// sanityFetch() from defineLive() sets its own next.revalidate and next.tags
// per query. A route-level revalidate export overrides those per-fetch settings,
// which would replace Sanity's tag-based cache invalidation (triggered by
// webhooks on publish) with dumb time-based polling. Let the webhook handle it.

// Render routes not covered by generateStaticParams on-demand (e.g. a
// brand-new conference added after the last build). Next.js caches the result
// after the first visit, so subsequent requests are still served from CDN.
export const dynamicParams = true;

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  params: Promise<{ sport: string; slug?: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

type BreadcrumbStop = { name: string; item: string };
type ComponentCrumb = { title: string | undefined | null; href: string };

// ── Route mode ────────────────────────────────────────────────────────────────
//
// [[...slug]] resolves to three URL shapes:
//   slug = undefined | []                    → /college/[sport]/news
//   slug = ["fcs"]                           → /college/[sport]/news/fcs
//   slug = ["fcs", "southern-conference"]    → /college/[sport]/news/fcs/southern-conference
//
// slug[0] is either a sportSubgrouping slug (fcs, fbs, mid-major) or a
// classification slug (d2, naia, njcaa-d1). The GROQ queries resolve both
// via an OR — no pre-resolution needed at the routing layer.
//
type RouteMode =
  | { mode: "sport" }
  | { mode: "division"; division: string }
  | { mode: "conference"; division: string; conference: string };

function getRouteMode(slug?: string[]): RouteMode {
  const [division, conference] = slug ?? [];
  if (!division) return { mode: "sport" };
  if (!conference) return { mode: "division", division };
  return { mode: "conference", division, conference };
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
//
// React's cache() deduplicates identical calls within a single server render.
// Both generateMetadata and the page component call fetchSportInfo with the
// same slug — without cache() that's two Sanity round-trips. With it, the
// second call returns the memoised result from the first.
//

const fetchSportInfo = cache((slug: string) =>
  sanityFetch({ query: sportInfoBySlug, params: { slug } }),
);

const fetchDivisionDisplayName = cache((slugOrShortName: string) =>
  sanityFetch({
    query: queryDivisionOrSubgroupingDisplayName,
    params: { slugOrShortName },
  }),
);

// conferenceInfoBySlugQuery is only used in generateMetadata for the
// conference case. In the page body, conferenceInfo is embedded in
// queryArticlesBySportDivisionAndConference, so no extra fetch happens there.
const fetchConferenceInfo = cache((slug: string) =>
  sanityFetch({ query: conferenceInfoBySlugQuery, params: { slug } }),
);

function fetchSportsNews(sport: string, from: number, to: number) {
  return sanityFetch({
    query: querySportsNews,
    params: { sport, from, to },
  });
}

function fetchSportsAndDivisionNews(
  sport: string,
  division: string,
  from: number,
  to: number,
) {
  return sanityFetch({
    query: querySportsAndDivisionNews,
    params: { sport, division, from, to },
  });
}

function fetchSportNewsForDivisionAndConference(
  sport: string,
  division: string,
  conference: string,
  from: number,
  to: number,
) {
  return sanityFetch({
    query: queryArticlesBySportDivisionAndConference,
    params: { sport, division, conference, from, to },
  });
}

// ── JSON-LD builder ───────────────────────────────────────────────────────────
//
// Both division and conference pages produce a CollectionPage with a
// BreadcrumbList. The structure is identical — only the names, URLs, and
// number of breadcrumb stops differ. One builder eliminates the duplication.
//

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
  /** Full URL including ?page= when paginated. */
  pageUrl: string;
  /** URL without pagination params — used as the ItemList url. */
  canonicalUrl: string;
  posts: Array<{ slug: string }>;
  totalPosts: number;
  baseUrl: string;
  /** Everything after "Home". Each entry becomes a ListItem at position n+2. */
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

// ── Breadcrumb helpers ────────────────────────────────────────────────────────

function divisionBreadcrumbStops(
  sport: string,
  sportTitle: string | undefined,
  division: string,
  divisionTitle: string | null | undefined,
  baseUrl: string,
): BreadcrumbStop[] {
  return [
    { name: "News", item: `${baseUrl}/college/news` },
    { name: sportTitle ?? sport, item: `${baseUrl}/college/${sport}/news` },
    {
      name: divisionTitle ?? division,
      item: `${baseUrl}/college/${sport}/news/${division}`,
    },
  ];
}

function conferenceBreadcrumbStops(
  sport: string,
  sportTitle: string | undefined,
  division: string,
  divisionTitle: string | null | undefined,
  conference: string,
  conferenceName: string,
  baseUrl: string,
): BreadcrumbStop[] {
  return [
    ...divisionBreadcrumbStops(
      sport,
      sportTitle,
      division,
      divisionTitle,
      baseUrl,
    ),
    {
      name: conferenceName,
      item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
    },
  ];
}

function componentCrumbs(stops: BreadcrumbStop[]): ComponentCrumb[] {
  // Strip the base URL prefix from the BreadcrumbStop hrefs to produce
  // relative hrefs for the PageHeader component.
  return stops.map((s) => ({
    title: s.name,
    href: s.item.replace(/^https?:\/\/[^/]+/, ""),
  }));
}

// ── generateStaticParams ──────────────────────────────────────────────────────
//
// Pre-renders every route combination that currently has articles, keeping
// build output lean for 759 articles across 88 conferences.
//
// Requires the parent [sport] segment to also define generateStaticParams so
// Next.js calls this function once per sport with params.sport resolved.
// If [sport] has no generateStaticParams, this function will still run once
// but params.sport will be undefined — in that case, no static paths are
// generated and all routes fall back to on-demand ISR (still correct, just
// not pre-built).
//
export async function generateStaticParams({
  params,
}: {
  params: { sport: string };
}) {
  const { sport } = params;

  if (!sport) return [];

  const { data: posts } = await sanityFetch({
    // Derive the route-relevant slugs directly from each post so we only
    // generate paths that correspond to real content.
    query: `*[_type == "post" && sport->slug.current == $sport]{
      "division": coalesce(sportSubgrouping->slug.current, classification->slug.current),
      "conferences": conferences[]->slug.current
    }`,
    params: { sport },
  });

  if (!posts?.length) return [{ slug: [] }];

  const seen = new Set<string>();
  const slugs: { slug: string[] }[] = [
    // Base route: /college/[sport]/news
    { slug: [] },
  ];

  for (const post of posts as Array<{
    division: string | null;
    conferences: (string | null)[] | null;
  }>) {
    const { division, conferences } = post;

    // Skip d1 — that route intentionally has no page (always use a subgrouping).
    if (!division || division === "d1") continue;

    // Division route: /college/[sport]/news/[division]
    if (!seen.has(division)) {
      seen.add(division);
      slugs.push({ slug: [division] });
    }

    // Conference routes: /college/[sport]/news/[division]/[conference]
    for (const conference of conferences ?? []) {
      if (!conference) continue;
      const key = `${division}/${conference}`;
      if (!seen.has(key)) {
        seen.add(key);
        slugs.push({ slug: [division, conference] });
      }
    }
  }

  return slugs;
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { sport, slug } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const routeMode = getRouteMode(slug);

  // ── Sport ────────────────────────────────────────────────────────────────────
  if (routeMode.mode === "sport") {
    const { data: sportData } = await fetchSportInfo(sport);

    if (!sportData?.title) return {};

    const { title: sportTitle } = sportData;
    const canonicalUrl = `/college/${sport}/news`;

    if (pageIndex > 1) {
      return getSEOMetadata({
        title: `College ${sportTitle} News & Updates - Page ${pageIndex}`,
        description: `Continue exploring comprehensive college ${sportTitle} news, game analysis, and feature stories. This is page ${page} of our in-depth coverage.`,
        slug: `${canonicalUrl}?page=${page}`,
      });
    }

    return getSEOMetadata({
      title: `College ${sportTitle} News & Updates`,
      description: `Find comprehensive college ${sportTitle} news, detailed game results, expert analysis, and valuable insights. Your trusted source for NCAA ${sportTitle} information.`,
      slug: canonicalUrl,
    });
  }

  // ── Division ──────────────────────────────────────────────────────────────────
  if (routeMode.mode === "division") {
    const { division } = routeMode;

    const [sportInfoResponse, divisionDisplayName] = await Promise.all([
      fetchSportInfo(sport),
      fetchDivisionDisplayName(division),
    ]);

    const sportTitle = sportInfoResponse?.data?.title;
    const divisionName = divisionDisplayName.data?.displayName;

    if (!sportTitle || !divisionName) {
      return {
        title: `Sports News | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Stay updated with the latest sports news and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
      };
    }

    const baseTitle = `${divisionName} ${sportTitle} News, Updates & Analysis`;
    const baseCanonical = `/college/${sport}/news/${division}`;

    if (pageIndex > 1) {
      return getSEOMetadata({
        title: `${baseTitle} - Page ${pageIndex}`,
        description: `More ${divisionName} ${sportTitle} stories on Page ${pageIndex}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis.`,
        slug: `${baseCanonical}?page=${pageIndex}`,
      });
    }

    return getSEOMetadata({
      title: baseTitle,
      description: `Complete ${divisionName} ${sportTitle} coverage including breaking news, game analysis, player spotlights, and coaching updates. Your go-to source for ${sportTitle} insights.`,
      slug: baseCanonical,
    });
  }

  // ── Conference ────────────────────────────────────────────────────────────────
  const { division, conference } = routeMode;

  const [divisionDisplayName, conferenceInfo, sportInfoResponse] =
    await Promise.all([
      fetchDivisionDisplayName(division),
      fetchConferenceInfo(conference),
      fetchSportInfo(sport),
    ]);

  if (
    !conferenceInfo ||
    !sportInfoResponse.data?.title ||
    !divisionDisplayName?.data
  ) {
    return {};
  }

  const sportTitle = sportInfoResponse.data.title;
  const divisionName = divisionDisplayName.data.displayName;
  const conferenceName =
    conferenceInfo.data?.shortName ?? conferenceInfo.data?.name;
  const baseTitle = `${conferenceName} ${divisionName} ${sportTitle} News, Updates & Analysis`;
  const baseCanonical = `/college/${sport}/news/${division}/${conference}`;

  if (pageIndex > 1) {
    return getSEOMetadata({
      title: `${baseTitle} - Page ${pageIndex}`,
      description: `Continue exploring coverage of ${conferenceName} ${divisionName} ${sportTitle} on Page ${pageIndex}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
      slug: `${baseCanonical}?page=${pageIndex}`,
    });
  }

  return getSEOMetadata({
    title: baseTitle,
    description: `Stay informed with breaking ${conferenceName} ${divisionName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    slug: baseCanonical,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Page({ params, searchParams }: Props) {
  const { sport, slug } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const routeMode = getRouteMode(slug);
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  // ── Sport ─────────────────────────────────────────────────────────────────────
  if (routeMode.mode === "sport") {
    const [newsResponse, sportInfoResponse] = await Promise.all([
      fetchSportsNews(sport, from, to),
      fetchSportInfo(sport), // cache() returns memoised value from generateMetadata
    ]);

    const news = newsResponse.data;
    const sportInfo = sportInfoResponse?.data;

    if (!news?.posts?.length) notFound();

    const totalPages = Math.ceil(news.totalPosts / perPage);

    return (
      <>
        <PageHeader
          title={`College ${sportInfo?.title} News`}
          breadcrumbs={[
            { title: "News", href: "/college/news" },
            { title: sportInfo?.title, href: `/college/${sport}/news` },
          ]}
        />
        <section className="container pb-12">
          <ArticleFeed articles={news.posts} />
          {totalPages > 1 && (
            <PaginationControls totalPosts={news.totalPosts} />
          )}
        </section>
      </>
    );
  }

  // ── Division ──────────────────────────────────────────────────────────────────
  if (routeMode.mode === "division") {
    const { division } = routeMode;

    const [newsResponse, sportInfoResponse, divisionNameResponse] =
      await Promise.all([
        fetchSportsAndDivisionNews(sport, division, from, to),
        fetchSportInfo(sport),
        fetchDivisionDisplayName(division),
      ]);

    const news = newsResponse.data;
    const sportInfo = sportInfoResponse.data;
    const divisionName = divisionNameResponse.data?.displayName;

    if (!news?.posts?.length) notFound();

    const sportTitle = sportInfo?.title;
    const totalPages = Math.ceil(news.totalPosts / perPage);
    const canonicalUrl = `${baseUrl}/college/${sport}/news/${division}`;

    const breadcrumbStops = divisionBreadcrumbStops(
      sport,
      sportTitle,
      division,
      divisionName,
      baseUrl,
    );

    const jsonLd = buildCollectionPageJsonLd({
      name: `${divisionName} ${sportTitle} News`,
      description: `Stay informed with breaking ${divisionName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
      pageUrl: `${canonicalUrl}${page ? `?page=${page}` : ""}`,
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
        <PageHeader
          title={`${divisionName} ${sportTitle} News`}
          // @ts-expect-error breadcrumb item type mismatch
          breadcrumbs={componentCrumbs(breadcrumbStops)}
        />
        <section className="container pb-12">
          <ArticleFeed articles={news.posts} />
          {totalPages > 1 && (
            <Suspense fallback={<>Loading...</>}>
              <PaginationControls totalPosts={news.totalPosts} />
            </Suspense>
          )}
        </section>
      </>
    );
  }

  // ── Conference ────────────────────────────────────────────────────────────────
  const { division, conference } = routeMode;

  const [newsResponse, sportInfoResponse, divisionNameResponse] =
    await Promise.all([
      fetchSportNewsForDivisionAndConference(
        sport,
        division,
        conference,
        from,
        to,
      ),
      fetchSportInfo(sport),
      fetchDivisionDisplayName(division),
    ]);

  const news = newsResponse.data;
  const sportInfo = sportInfoResponse.data;
  const divisionName = divisionNameResponse.data?.displayName;

  if (!news?.posts?.length || !news.conferenceInfo) notFound();

  const sportTitle = sportInfo?.title;
  const totalPages = Math.ceil(news.totalPosts / perPage);

  const conferenceName =
    news.conferenceInfo.shortName ?? news.conferenceInfo.name;
  const pageTitle = `${conferenceName} ${sportTitle} News`;
  const canonicalUrl = `${baseUrl}/college/${sport}/news/${division}/${conference}`;

  const breadcrumbStops = conferenceBreadcrumbStops(
    sport,
    sportTitle,
    division,
    divisionName,
    conference,
    conferenceName,
    baseUrl,
  );

  const jsonLd = buildCollectionPageJsonLd({
    name: pageTitle,
    description: `Stay informed with breaking ${conferenceName} ${divisionName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    pageUrl: `${canonicalUrl}${page ? `?page=${page}` : ""}`,
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
      <PageHeader
        title={pageTitle}
        // @ts-expect-error breadcrumb item type mismatch
        breadcrumbs={componentCrumbs(breadcrumbStops)}
      />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  );
}
