import {
  getYearsWithVotes,
  type SportParam,
} from "@redshirt-sports/db/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

export function generateSitemaps() {
  return [{ id: 0 }];
}

const baseUrl = getBaseUrl();

export default async function sitemap({
  params,
}: {
  id?: number;
  params?: Promise<{ sport?: SportParam }>;
}): Promise<MetadataRoute.Sitemap> {
  "use cache";
  const { sport = "football" } = (await params) ?? {};
  const yearsWithVotes = await getYearsWithVotes(sport);

  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week === 999 ? "final-rankings" : week}`,
    lastModified: new Date(),
    priority: 0.7,
  }));
}
