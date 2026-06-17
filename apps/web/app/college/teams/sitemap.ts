import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  schoolSlugsForSitemapQuery,
} from "@redshirt-sports/sanity/queries";
import type { SchoolSlugsForSitemapQueryResult } from "@redshirt-sports/sanity/types";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = (await sanityFetchMetadata({
    query: schoolSlugsForSitemapQuery,
    params: { minPosts: MIN_TEAM_PAGE_POSTS },
    perspective: "published",
  })) as { data: SchoolSlugsForSitemapQueryResult | null };
  const schools = data ?? [];

  return schools.map((school) => ({
    url: `${baseUrl}/college/teams/${school.slug}`,
    lastModified: new Date(school._updatedAt),
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}
