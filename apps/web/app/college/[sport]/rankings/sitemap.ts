import {
  formatWeekSegment,
  type SportParam,
} from "@redshirt-sports/clients/espn";
import { getYearsWithVotes, listSports } from "@redshirt-sports/db/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import { SPORT_SLUG_MAP } from "@/lib/vote-ballot";

const baseUrl = getBaseUrl();

function sportParam(slug: string): SportParam | null {
  return SPORT_SLUG_MAP[slug] ?? null;
}

async function fetchYearsWithVotesForSitemap() {
  "use cache";
  return getYearsWithVotes();
}

async function fetchSportsForSitemap() {
  "use cache";
  return listSports();
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
    weekEntries.push(
      { url: base, priority: 0.7 },
      { url: `${base}/ballots`, priority: 0.65 },
      { url: `${base}/ballots/by-voter`, priority: 0.6 },
    );
  }

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

  return [...indexEntries, ...divisionEntries, ...weekEntries];
}
