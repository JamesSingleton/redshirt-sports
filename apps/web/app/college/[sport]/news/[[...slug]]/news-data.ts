import { sanityFetch } from "@redshirt-sports/sanity/live";
import {
  queryArticlesBySportDivisionAndConference,
  queryConferenceInfoForSportAndSubgrouping,
  queryConferenceSubgroupingsForSport,
  queryNewsSegmentDisplayName,
  querySportUsesSubgroupings,
  querySportsAndDivisionNews,
  querySportsNews,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

import {
  collectNewsRouteSlugs,
  conferenceMatchesNewsSegment,
  isD1ClassificationSlug,
  resolveNewsRouteSegment,
  type NewsRouteConference,
  type NewsRouteSlugPost,
} from "@/lib/college-news-segments";
import { perPage } from "@/lib/constants";

export type RouteMode =
  | { mode: "sport" }
  | { mode: "division"; division: string }
  | { mode: "conference"; division: string; conference: string };

export {
  collectNewsRouteSlugs,
  conferenceMatchesNewsSegment,
  isD1ClassificationSlug,
  isD1ClassificationSlug as isBlockedNewsSegment,
  resolveNewsRouteSegment,
  type NewsRouteConference,
  type NewsRouteSlugPost,
};

export function getRouteMode(slug?: string[]): RouteMode {
  const [division, conference] = slug ?? [];
  if (!division) return { mode: "sport" };
  if (!conference) return { mode: "division", division };
  return { mode: "conference", division, conference };
}

export function getPaginationRange(pageIndex: number) {
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  return { from, to };
}

export const fetchSportInfo = cache((slug: string) =>
  sanityFetch({ query: sportInfoBySlug, params: { slug } }),
);

export const fetchDivisionDisplayName = cache((slugOrShortName: string) =>
  sanityFetch({
    query: queryNewsSegmentDisplayName,
    params: { slugOrShortName },
  }),
);

export const fetchConferenceForSportAndSubgrouping = cache(
  (sport: string, subgrouping: string, conference: string) =>
    sanityFetch({
      query: queryConferenceInfoForSportAndSubgrouping,
      params: { sport, subgrouping, conference },
    }),
);

export const fetchConferenceSubgroupingsForSport = cache(
  (sport: string, conference: string) =>
    sanityFetch({
      query: queryConferenceSubgroupingsForSport,
      params: { sport, conference },
    }),
);

/**
 * For sports with subgroupings (football, basketball), bare "d1" URLs are invalid.
 * Redirect /d1/[conference] → /fbs/[conference] when unambiguous; otherwise 404.
 * No-op for sports that only use classification-based "d1" routes (e.g. swimming).
 */
export async function guardD1NewsSegment(
  sport: string,
  routeMode: RouteMode,
): Promise<void> {
  if (routeMode.mode === "sport") return;
  if (!isD1ClassificationSlug(routeMode.division)) return;

  const sportUsesSubgroupings = await fetchSportUsesSubgroupings(sport);
  if (!sportUsesSubgroupings) return;

  if (routeMode.mode === "conference") {
    const { data } = await fetchConferenceSubgroupingsForSport(
      sport,
      routeMode.conference,
    );
    const subgroupings = (
      (data as { subgroupings?: (string | null)[] } | null)?.subgroupings ?? []
    ).filter(
      (slug: string | null): slug is string =>
        !!slug && !isD1ClassificationSlug(slug),
    );

    if (subgroupings.length === 1) {
      permanentRedirect(
        `/college/${sport}/news/${subgroupings[0]}/${routeMode.conference}`,
      );
    }
  }

  notFound();
}

export const fetchSportUsesSubgroupings = cache(async (sport: string) => {
  const { data } = await sanityFetch({
    query: querySportUsesSubgroupings,
    params: { sport },
  });
  return Boolean(data);
});

export const fetchSportsNews = cache(
  (sport: string, from: number, to: number) =>
    sanityFetch({
      query: querySportsNews,
      params: { sport, from, to },
    }),
);

export const fetchSportsAndDivisionNews = cache(
  (sport: string, division: string, from: number, to: number) =>
    sanityFetch({
      query: querySportsAndDivisionNews,
      params: { sport, division, from, to },
    }),
);

export const fetchSportNewsForDivisionAndConference = cache(
  (
    sport: string,
    division: string,
    conference: string,
    from: number,
    to: number,
  ) =>
    sanityFetch({
      query: queryArticlesBySportDivisionAndConference,
      params: { sport, division, conference, from, to },
    }),
);

/** Start the article query during generateMetadata so it overlaps metadata work. */
export function preloadNewsFeed(
  sport: string,
  routeMode: RouteMode,
  pageIndex: number,
) {
  const { from, to } = getPaginationRange(pageIndex);

  if (routeMode.mode === "sport") {
    void fetchSportsNews(sport, from, to);
    return;
  }

  if (routeMode.mode === "division") {
    void fetchSportsAndDivisionNews(sport, routeMode.division, from, to);
    return;
  }

  void fetchSportNewsForDivisionAndConference(
    sport,
    routeMode.division,
    routeMode.conference,
    from,
    to,
  );
}
