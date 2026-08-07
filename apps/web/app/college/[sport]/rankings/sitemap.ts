import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { getYearsWithVotes } from "@redshirt-sports/db/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

export function generateSitemaps() {
  return [{ id: 0 }];
}

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const yearsWithVotes = await getYearsWithVotes();
  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${baseUrl}/college/football/rankings/${division}/${year}/${formatWeekSegment(week)}`,
    lastModified: new Date(),
    priority: 0.7,
  }));
}
