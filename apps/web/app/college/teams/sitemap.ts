import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  schoolSlugsByIdsQuery,
  schoolSlugsForSitemapQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  SchoolSlugsByIdsQueryResult,
  SchoolSlugsForSitemapQueryResult,
} from "@redshirt-sports/sanity/types";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";
import { getCachedRankedSchoolSanityIds } from "@/lib/rankings-data";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: postQualified }, rankedSanityIds] = await Promise.all([
    sanityFetchMetadata({
      query: schoolSlugsForSitemapQuery,
      params: { minPosts: MIN_TEAM_PAGE_POSTS },
      perspective: "published",
    }) as Promise<{ data: SchoolSlugsForSitemapQueryResult | null }>,
    getCachedRankedSchoolSanityIds(),
  ]);

  const rankedSlugs =
    rankedSanityIds.length > 0
      ? ((
          await sanityFetchMetadata({
            query: schoolSlugsByIdsQuery,
            params: { ids: rankedSanityIds },
            perspective: "published",
          })
        ).data as SchoolSlugsByIdsQueryResult | null)
      : [];

  const bySlug = new Map<string, { slug: string; _updatedAt: string }>();
  for (const school of postQualified ?? []) {
    bySlug.set(school.slug, school);
  }
  for (const school of rankedSlugs ?? []) {
    const existing = bySlug.get(school.slug);
    if (
      !existing ||
      new Date(school._updatedAt) > new Date(existing._updatedAt)
    ) {
      bySlug.set(school.slug, school);
    }
  }

  return [...bySlug.values()].map((school) => ({
    url: `${baseUrl}/college/teams/${school.slug}`,
    lastModified: new Date(school._updatedAt),
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}
