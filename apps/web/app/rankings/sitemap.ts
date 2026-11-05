import {
  formatWeekSegment,
  type SportParam,
} from "@redshirt-sports/clients/espn";
import {
  getLatestFinalRankings,
  getYearsWithVotes,
} from "@redshirt-sports/db/queries";
import { RANKINGS_CACHE_TAG } from "@redshirt-sports/db/rankings-cache-tags";
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { getBaseUrl } from "@/lib/get-base-url";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import { RANKINGS_CACHE_LIFE } from "@/lib/rankings-data";
import { SPORT_SLUG_MAP } from "@/lib/vote-ballot";

async function fetchPublishedWeeksForSitemap() {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getYearsWithVotes();
}

async function fetchLatestPollForSitemap(sport: SportParam, division: string) {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return (await getLatestFinalRankings({ division, sport })) ?? null;
}

/**
 * Every sport's rankings URLs. Built only from published poll weeks, so a
 * sport (and its rankings index) joins once its first poll publishes;
 * publishing expires the rankings cache tag.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const divisionsBySport = new Map<SportParam, Set<string>>();
  const weekEntries: MetadataRoute.Sitemap = [];

  const publishedWeeks = await fetchPublishedWeeksForSitemap();
  for (const {
    year,
    week,
    division,
    sport: sportSlug,
    publishedAt,
  } of publishedWeeks) {
    const sport = SPORT_SLUG_MAP[sportSlug];
    if (!sport) continue;

    const divisions = divisionsBySport.get(sport) ?? new Set<string>();
    divisions.add(division);
    divisionsBySport.set(sport, divisions);

    weekEntries.push({
      url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${formatWeekSegment(week)}`,
      priority: 0.7,
      ...(publishedAt ? { lastModified: publishedAt } : {}),
    });
  }

  const polls = [...divisionsBySport].flatMap(([sport, divisions]) =>
    [...divisions].map((division) => ({ sport, division })),
  );
  const latestPolls = await Promise.all(
    polls.map(({ sport, division }) =>
      fetchLatestPollForSitemap(sport, division),
    ),
  );
  const latestPollEntries: MetadataRoute.Sitemap = polls.map(
    ({ sport, division }, index) => ({
      url: `${baseUrl}${pollLatestPath(sport, division)}`,
      changeFrequency: "weekly",
      priority: 0.8,
      ...(latestPolls[index]?.publishedAt
        ? { lastModified: latestPolls[index].publishedAt }
        : {}),
    }),
  );

  const pollEntries: MetadataRoute.Sitemap = polls.flatMap(
    ({ sport, division }) => [
      {
        url: `${baseUrl}/college/${sport}/rankings/${division}/voters`,
        priority: 0.55,
      },
      {
        url: `${baseUrl}/college/${sport}/rankings/${division}/history`,
        priority: 0.55,
      },
    ],
  );

  const indexEntries: MetadataRoute.Sitemap = [...divisionsBySport.keys()].map(
    (sport) => ({
      url: `${baseUrl}/college/${sport}/rankings`,
      priority: 0.75,
    }),
  );

  return [
    ...indexEntries,
    ...latestPollEntries,
    ...pollEntries,
    ...weekEntries,
  ];
}
