import {
  formatWeekSegment,
  type SportParam,
} from "@redshirt-sports/clients/espn";
import {
  getLatestFinalRankings,
  getYearsWithVotes,
} from "@redshirt-sports/db/queries";
import {
  RANKINGS_CACHE_TAG,
  rankingsSportTag,
} from "@redshirt-sports/db/rankings-cache-tags";
import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { getBaseUrl } from "@/lib/get-base-url";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import { RANKINGS_CACHE_LIFE } from "@/lib/rankings-data";
import { SPORT_SLUG_MAP } from "@/lib/vote-ballot";

/** Every published poll week, across all sports. */
async function fetchPublishedWeeks() {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getYearsWithVotes();
}

async function fetchLatestPoll(sport: SportParam, division: string) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsSportTag(sport));
  cacheLife(RANKINGS_CACHE_LIFE);
  return (await getLatestFinalRankings({ division, sport })) ?? null;
}

export function rankingsSitemapPath(sport: SportParam) {
  return `/college/${sport}/rankings/sitemap.xml`;
}

/**
 * Sports with at least one published poll week. Only these get a rankings
 * sitemap, so a sport appears in robots.txt once its first poll publishes.
 */
export async function sportsWithPublishedRankings(): Promise<SportParam[]> {
  const weeks = await fetchPublishedWeeks();
  const sports = new Set<SportParam>();
  for (const { sport } of weeks) {
    const param = SPORT_SLUG_MAP[sport];
    if (param) sports.add(param);
  }
  return [...sports];
}

/** One sport's rankings URLs; empty when the sport has no published poll. */
export async function rankingsSitemapEntries(
  sport: SportParam,
): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const weeks = (await fetchPublishedWeeks()).filter(
    (week) => week.sport === sport,
  );
  if (weeks.length === 0) return [];

  const divisions = new Set<string>();
  const weekEntries: MetadataRoute.Sitemap = [];
  for (const { year, week, division } of weeks) {
    divisions.add(division);
    weekEntries.push({
      url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${formatWeekSegment(week)}`,
      priority: 0.7,
    });
  }

  // Stable latest-poll URLs: only polls with a published week appear here,
  // so unlaunched polls are never submitted.
  const pollDivisions = [...divisions];
  const latestPolls = await Promise.all(
    pollDivisions.map((division) => fetchLatestPoll(sport, division)),
  );
  const latestPollEntries: MetadataRoute.Sitemap = pollDivisions.map(
    (division, index) => ({
      url: `${baseUrl}${pollLatestPath(sport, division)}`,
      changeFrequency: "weekly",
      priority: 0.8,
      ...(latestPolls[index]?.publishedAt
        ? { lastModified: latestPolls[index].publishedAt }
        : {}),
    }),
  );

  const divisionEntries: MetadataRoute.Sitemap = pollDivisions.flatMap(
    (division) => [
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

  return [
    { url: `${baseUrl}/college/${sport}/rankings`, priority: 0.75 },
    ...latestPollEntries,
    ...divisionEntries,
    ...weekEntries,
  ];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Serialize entries as a sitemaps.org `urlset`. */
export function sitemapXml(entries: MetadataRoute.Sitemap) {
  const urls = entries.map((entry) => {
    const fields = [`<loc>${escapeXml(entry.url)}</loc>`];
    if (entry.lastModified) {
      fields.push(
        `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`,
      );
    }
    if (entry.changeFrequency) {
      fields.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
    }
    if (entry.priority !== undefined) {
      fields.push(`<priority>${entry.priority}</priority>`);
    }
    return `<url>\n${fields.join("\n")}\n</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
