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
  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${baseUrl}/college/football/rankings/${division}/${year}/${formatWeekSegment(week)}`,
    priority: 0.7,
  }));
}
