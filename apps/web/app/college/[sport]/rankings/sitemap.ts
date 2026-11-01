import {
  formatWeekSegment,
  type SportParam,
} from "@redshirt-sports/clients/espn";
import {
  getLatestFinalRankings,
  getYearsWithVotes,
  listSports,
} from "@redshirt-sports/db/queries";
import { RANKINGS_CACHE_TAG } from "@redshirt-sports/db/rankings-cache-tags";
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { getBaseUrl } from "@/lib/get-base-url";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import { RANKINGS_CACHE_LIFE } from "@/lib/rankings-data";
import { SPORT_SLUG_MAP } from "@/lib/vote-ballot";

const baseUrl = getBaseUrl();

function sportParam(slug: string): SportParam | null {
  return SPORT_SLUG_MAP[slug] ?? null;
}

async function fetchYearsWithVotesForSitemap() {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getYearsWithVotes();
}

async function fetchSportsForSitemap() {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return listSports();
}

async function fetchLatestPollForSitemap(sport: string, division: string) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return (await getLatestFinalRankings({ division, sport })) ?? null;
}

export function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [yearsWithVotes, sports] = await Promise.all([
    fetchYearsWithVotesForSitemap(),
    fetchSportsForSitemap(),
  ]);

  const indexSports = new Set<SportParam>();
  for (const sport of sports) {
    const param = sportParam(sport.slug);
    if (param) indexSports.add(param);
  }

  const divisionsBySport = new Map<SportParam, Set<string>>();
  const weekEntries: MetadataRoute.Sitemap = [];

  for (const { year, week, division, sport: sportSlug } of yearsWithVotes) {
    const sport = sportParam(sportSlug);
    if (!sport) continue;

    indexSports.add(sport);
    const divisions = divisionsBySport.get(sport) ?? new Set<string>();
    divisions.add(division);
    divisionsBySport.set(sport, divisions);

    const weekSegment = formatWeekSegment(week);
    const base = `${baseUrl}/college/${sport}/rankings/${division}/${year}/${weekSegment}`;
    weekEntries.push({ url: base, priority: 0.7 });
  }

  // Stable latest-poll URLs: only polls with a published week appear here
  // (divisionsBySport comes from published rankings), so unlaunched polls
  // are never submitted.
  const pollPairs = [...divisionsBySport].flatMap(([sport, divisions]) =>
    [...divisions].map((division) => ({ sport, division })),
  );
  const latestPolls = await Promise.all(
    pollPairs.map(({ sport, division }) =>
      fetchLatestPollForSitemap(sport, division),
    ),
  );
  const latestPollEntries: MetadataRoute.Sitemap = pollPairs.map(
    ({ sport, division }, index) => ({
      url: `${baseUrl}${pollLatestPath(sport, division)}`,
      changeFrequency: "weekly",
      priority: 0.8,
      ...(latestPolls[index]?.publishedAt
        ? { lastModified: latestPolls[index].publishedAt }
        : {}),
    }),
  );

  const divisionEntries: MetadataRoute.Sitemap = [];
  for (const [sport, divisions] of divisionsBySport) {
    for (const division of divisions) {
      divisionEntries.push(
        {
          url: `${baseUrl}/college/${sport}/rankings/${division}/voters`,
          priority: 0.55,
        },
        {
          url: `${baseUrl}/college/${sport}/rankings/${division}/history`,
          priority: 0.55,
        },
      );
    }
  }

  const indexEntries: MetadataRoute.Sitemap = [...indexSports].map((sport) => ({
    url: `${baseUrl}/college/${sport}/rankings`,
    priority: 0.75,
  }));

  return [
    ...indexEntries,
    ...latestPollEntries,
    ...divisionEntries,
    ...weekEntries,
  ];
}
