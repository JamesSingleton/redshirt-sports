import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import {
  conferenceInfoBySlugQuery,
  queryConferencesForSportDivision,
  queryDivisionOrSubgroupingDisplayName,
  querySportNewsDivisionSlugsWithPosts,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";

import type { CollegeNewsConferenceOption } from "@/components/college-news/college-news-conference-filter";
import type { NavLink } from "@/components/nav-config";
import {
  filterSportDivisionsWithArticles,
  getSportNavConfig,
  resolveDivisionRouteSlug,
} from "@/lib/college-news-config";
import {
  type CollegeNewsPollWidgetData,
  getDivisionPollWidgetData,
  getSportPollWidgetData,
} from "@/lib/college-news-rankings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

function normalizeDivisionSlugs(
  slugs: Array<string | null> | null | undefined,
): string[] {
  if (!slugs?.length) {
    return [];
  }

  return slugs.filter((slug): slug is string => typeof slug === "string");
}

export type CollegeNewsSportLayoutData = {
  sport: string;
  sportTitle: string;
  sportConfig: ReturnType<typeof getSportNavConfig>;
  divisionNavLinks: NavLink[];
  pollWidget: CollegeNewsPollWidgetData | null;
};

export type CollegeNewsDivisionLayoutData = CollegeNewsSportLayoutData & {
  division: string;
  divisionName: string;
  conferences: CollegeNewsConferenceOption[];
};

export type CollegeNewsConferenceLayoutData = CollegeNewsDivisionLayoutData & {
  conference: string;
  conferenceName: string;
};

export async function fetchCollegeNewsSportLayoutData({
  sport,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sport: string;
}): Promise<CollegeNewsSportLayoutData | null> {
  "use cache";
  const sportConfig = getSportNavConfig(sport);
  const [sportInfoResponse, divisionSlugsResponse, pollWidget] =
    await Promise.all([
      sanityFetchPage({
        query: sportInfoBySlug,
        params: { slug: sport },
        perspective,
        stega,
      }),
      sportConfig
        ? sanityFetchPage({
            query: querySportNewsDivisionSlugsWithPosts,
            params: { sport },
            perspective,
            stega,
          })
        : Promise.resolve({ data: [] as string[] }),
      getSportPollWidgetData(sport),
    ]);

  const sportInfo = sportInfoResponse.data;

  if (!sportInfo?.title) {
    return null;
  }

  return {
    sport,
    sportTitle: sportInfo.title,
    sportConfig,
    divisionNavLinks: filterSportDivisionsWithArticles(
      sportConfig,
      normalizeDivisionSlugs(divisionSlugsResponse.data),
    ),
    pollWidget,
  };
}

export async function fetchCollegeNewsDivisionLayoutData({
  sport,
  division,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
}): Promise<CollegeNewsDivisionLayoutData | null> {
  "use cache";
  const resolvedDivision = resolveDivisionRouteSlug(division);
  const [sportLayout, divisionNameResponse, conferencesResponse, pollWidget] =
    await Promise.all([
      fetchCollegeNewsSportLayoutData({ sport, perspective, stega }),
      sanityFetchPage({
        query: queryDivisionOrSubgroupingDisplayName,
        params: { slugOrShortName: resolvedDivision },
        perspective,
        stega,
      }),
      sanityFetchPage({
        query: queryConferencesForSportDivision,
        params: { sport, division: resolvedDivision },
        perspective,
        stega,
      }),
      getDivisionPollWidgetData(sport, resolvedDivision),
    ]);

  const divisionName = divisionNameResponse.data?.displayName;
  if (!sportLayout || !divisionName) {
    return null;
  }

  const conferences =
    conferencesResponse.data?.map((conference) => ({
      label: conference.shortName ?? conference.name,
      slug: conference.slug,
    })) ?? [];

  return {
    ...sportLayout,
    division: resolvedDivision,
    divisionName,
    conferences,
    pollWidget,
  };
}

export async function fetchCollegeNewsConferenceLayoutData({
  sport,
  division,
  conference,
  perspective,
  stega,
}: DynamicFetchOptions & {
  sport: string;
  division: string;
  conference: string;
}): Promise<CollegeNewsConferenceLayoutData | null> {
  "use cache";
  const [divisionLayout, conferenceResponse] = await Promise.all([
    fetchCollegeNewsDivisionLayoutData({
      sport,
      division,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: conferenceInfoBySlugQuery,
      params: { slug: conference },
      perspective,
      stega,
    }),
  ]);

  const conferenceInfo = conferenceResponse.data;
  if (!divisionLayout || !conferenceInfo) {
    return null;
  }

  return {
    ...divisionLayout,
    conference,
    conferenceName: conferenceInfo.shortName ?? conferenceInfo.name,
  };
}
