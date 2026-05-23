import { client } from "@redshirt-sports/sanity/client";
import {
  queryNewsRouteSlugsBySport,
  querySportUsesSubgroupings,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PageHeader from "@/components/page-header";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";
import { validatePageIndex } from "@/utils/validate-page-index";

import {
  collectNewsRouteSlugs,
  fetchConferenceForSportAndSubgrouping,
  fetchConferenceSubgroupingsForSport,
  fetchDivisionDisplayName,
  fetchSportInfo,
  fetchSportUsesSubgroupings,
  getPaginationRange,
  getRouteMode,
  guardD1NewsSegment,
  type NewsRouteSlugPost,
  preloadNewsFeed,
} from "./news-data";
import {
  ConferenceNewsSection,
  DivisionNewsSection,
  NewsFeedSection,
} from "./news-feed";

export const dynamicParams = true;

type Props = {
  params: Promise<{ sport: string; slug?: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

type BreadcrumbStop = { name: string; item: string };
type ComponentCrumb = { title: string | undefined | null; href: string };

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
  return stops.map((s) => ({
    title: s.name,
    href: s.item.replace(/^https?:\/\/[^/]+/, ""),
  }));
}

export async function generateStaticParams({
  params,
}: {
  params: { sport: string };
}) {
  const { sport } = params;

  if (!sport) return [];

  const posts = await client
    .withConfig({ useCdn: false })
    .fetch(queryNewsRouteSlugsBySport, { sport });

  if (!posts?.length) return [{ slug: [] }];

  const sportUsesSubgroupings = await client
    .withConfig({ useCdn: false })
    .fetch(querySportUsesSubgroupings, { sport });

  return collectNewsRouteSlugs(
    posts as NewsRouteSlugPost[],
    sport,
    Boolean(sportUsesSubgroupings),
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { sport, slug } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const routeMode = getRouteMode(slug);

  await guardD1NewsSegment(sport, routeMode);

  preloadNewsFeed(sport, routeMode, pageIndex);

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

  if (routeMode.mode === "division") {
    const { division } = routeMode;

    const [sportInfoResponse, divisionDisplayName] = await Promise.all([
      fetchSportInfo(sport),
      fetchDivisionDisplayName(division),
    ]);

    const sportTitle = sportInfoResponse?.data?.title;
    const divisionName = (
      divisionDisplayName.data as { displayName?: string } | null
    )?.displayName;

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

  const { division, conference } = routeMode;

  const [divisionDisplayName, conferenceInfo, sportInfoResponse] =
    await Promise.all([
      fetchDivisionDisplayName(division),
      fetchConferenceForSportAndSubgrouping(sport, division, conference),
      fetchSportInfo(sport),
    ]);

  if (
    !conferenceInfo.data ||
    !sportInfoResponse.data?.title ||
    !divisionDisplayName?.data
  ) {
    return {};
  }

  const sportTitle = sportInfoResponse.data.title;
  const divisionName = (
    divisionDisplayName.data as { displayName: string }
  ).displayName;
  const conferenceData = conferenceInfo.data as {
    shortName?: string;
    name: string;
  };
  const conferenceName = conferenceData.shortName ?? conferenceData.name;
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

export default async function Page({ params, searchParams }: Props) {
  const { sport, slug } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);
  const routeMode = getRouteMode(slug);
  const baseUrl = getBaseUrl();
  const { from, to } = getPaginationRange(pageIndex);

  await guardD1NewsSegment(sport, routeMode);

  if (routeMode.mode === "sport") {
    const { data: sportInfo } = await fetchSportInfo(sport);

    if (!sportInfo?.title) notFound();

    return (
      <>
        <PageHeader
          title={`College ${sportInfo.title} News`}
          breadcrumbs={[
            { title: "News", href: "/college/news" },
            { title: sportInfo.title, href: `/college/${sport}/news` },
          ]}
        />
        <section className="container pb-12">
          <NewsFeedSection
            sport={sport}
            routeMode={routeMode}
            from={from}
            to={to}
          />
        </section>
      </>
    );
  }

  if (routeMode.mode === "division") {
    const { division } = routeMode;

    const [sportInfoResponse, divisionNameResponse] = await Promise.all([
      fetchSportInfo(sport),
      fetchDivisionDisplayName(division),
    ]);

    const sportTitle = sportInfoResponse.data?.title;
    const divisionName = (
      divisionNameResponse.data as { displayName?: string } | null
    )?.displayName;

    if (!sportTitle || !divisionName) notFound();

    const breadcrumbStops = divisionBreadcrumbStops(
      sport,
      sportTitle,
      division,
      divisionName,
      baseUrl,
    );

    return (
      <>
        <PageHeader
          title={`${divisionName} ${sportTitle} News`}
          // @ts-expect-error breadcrumb item type mismatch
          breadcrumbs={componentCrumbs(breadcrumbStops)}
        />
        <section className="container pb-12">
          <DivisionNewsSection
            sport={sport}
            division={division}
            from={from}
            to={to}
            pageQuery={page}
            baseUrl={baseUrl}
            breadcrumbStops={breadcrumbStops}
            divisionName={divisionName}
            sportTitle={sportTitle}
          />
        </section>
      </>
    );
  }

  const { division, conference } = routeMode;

  const [sportInfoResponse, divisionNameResponse, conferenceInfoResponse] =
    await Promise.all([
      fetchSportInfo(sport),
      fetchDivisionDisplayName(division),
      fetchConferenceForSportAndSubgrouping(sport, division, conference),
    ]);

  const sportTitle = sportInfoResponse.data?.title;
  const divisionName = (
    divisionNameResponse.data as { displayName?: string } | null
  )?.displayName;
  const conferenceInfo = conferenceInfoResponse.data as {
    shortName?: string;
    name: string;
  } | null;

  if (!sportTitle || !divisionName || !conferenceInfo) notFound();

  const conferenceName = conferenceInfo.shortName ?? conferenceInfo.name;
  const pageTitle = `${conferenceName} ${sportTitle} News`;

  const breadcrumbStops = conferenceBreadcrumbStops(
    sport,
    sportTitle,
    division,
    divisionName,
    conference,
    conferenceName,
    baseUrl,
  );

  return (
    <>
      <PageHeader
        title={pageTitle}
        // @ts-expect-error breadcrumb item type mismatch
        breadcrumbs={componentCrumbs(breadcrumbStops)}
      />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ConferenceNewsSection
          sport={sport}
          division={division}
          conference={conference}
          from={from}
          to={to}
          pageQuery={page}
          baseUrl={baseUrl}
          breadcrumbStops={breadcrumbStops}
          divisionName={divisionName}
          sportTitle={sportTitle}
          conferenceName={conferenceName}
          pageTitle={pageTitle}
        />
      </section>
    </>
  );
}
