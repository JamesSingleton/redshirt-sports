import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { getYearsWithVotes } from "@redshirt-sports/db/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

async function fetchYearsWithVotesForSitemap() {
  "use cache";
  return getYearsWithVotes();
}

export function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const yearsWithVotes = await fetchYearsWithVotesForSitemap();
  const divisions = new Set<string>();

  const weekEntries: MetadataRoute.Sitemap = yearsWithVotes.flatMap(
    ({ year, week, division }) => {
      divisions.add(division);
      const weekSegment = formatWeekSegment(week);
      const base = `${baseUrl}/college/football/rankings/${division}/${year}/${weekSegment}`;
      return [
        { url: base, priority: 0.7 },
        { url: `${base}/ballots`, priority: 0.65 },
        { url: `${base}/ballots/by-voter`, priority: 0.6 },
      ];
    },
  );

  const divisionEntries: MetadataRoute.Sitemap = [...divisions].flatMap(
    (division) => [
      {
        url: `${baseUrl}/college/football/rankings/${division}/voters`,
        priority: 0.55,
      },
      {
        url: `${baseUrl}/college/football/rankings/${division}/history`,
        priority: 0.55,
      },
      {
        url: `${baseUrl}/college/football/rankings/${division}/methodology`,
        priority: 0.5,
      },
    ],
  );

  return [
    { url: `${baseUrl}/college/football/rankings`, priority: 0.75 },
    ...divisionEntries,
    ...weekEntries,
  ];
}
