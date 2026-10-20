import {
  queryTeamDirectorySchools,
  queryTeamDirectorySchoolsByIds,
} from "@redshirt-sports/sanity/queries";
import type {
  QueryTeamDirectorySchoolsByIdsResult,
  QueryTeamDirectorySchoolsResult,
} from "@redshirt-sports/sanity/types";
import { cacheLife, cacheTag } from "next/cache";

import { getCachedRankedSchoolSanityIds } from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import {
  mapTeamDirectorySchool,
  type TeamDirectorySchool,
} from "@/lib/team-directory";

const TEAM_DIRECTORY_CACHE_TAG = "team-directory";

/**
 * Team directory inclusion (union):
 * 1. Sanity schools with at least one **published** post that tags the school (`teams[]`).
 * 2. Schools that appear in **any** published poll ranking row in Postgres (even with zero posts).
 */
export async function getCachedTeamDirectory(): Promise<TeamDirectorySchool[]> {
  "use cache";
  cacheTag(TEAM_DIRECTORY_CACHE_TAG);
  cacheLife({
    stale: 300,
    revalidate: 3600,
    expire: 86400,
  });

  const [{ data: withPosts }, rankedIds] = await Promise.all([
    sanityFetchPage({
      query: queryTeamDirectorySchools,
      params: {},
      perspective: "published",
      stega: false,
    }),
    getCachedRankedSchoolSanityIds(),
  ]);

  const byId = new Map<string, TeamDirectorySchool>();

  const schoolsWithPosts = (withPosts ?? []) as QueryTeamDirectorySchoolsResult;
  for (const row of schoolsWithPosts) {
    const mapped = mapTeamDirectorySchool(row);
    if (mapped) {
      byId.set(mapped._id, mapped);
    }
  }

  const missingRankedIds = rankedIds.filter((id) => !byId.has(id));
  if (missingRankedIds.length > 0) {
    const { data: rankedOnly } = await sanityFetchPage({
      query: queryTeamDirectorySchoolsByIds,
      params: { ids: missingRankedIds },
      perspective: "published",
      stega: false,
    });

    const rankedSchools = (rankedOnly ??
      []) as QueryTeamDirectorySchoolsByIdsResult;
    for (const row of rankedSchools) {
      const mapped = mapTeamDirectorySchool(row);
      if (mapped) {
        byId.set(mapped._id, mapped);
      }
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.sortName.localeCompare(b.sortName, undefined, { sensitivity: "base" }),
  );
}
