import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getRankedSchoolSanityIds,
  getSchoolRankingHistory,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  schoolHasPollRankings,
} from "@redshirt-sports/db/queries";
import {
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsDivisionWeeksTag,
  rankingsDivisionYearsTag,
  rankingsInvalidationTags,
  rankingsSportTag,
  rankingsWeekTag,
} from "@redshirt-sports/db/rankings-cache-tags";
import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import { cacheLife, cacheTag } from "next/cache";

import type { SportParam } from "@/utils/espn";

/**
 * Next.js `weeks` profile: 5m client stale, 1w background revalidate,
 * 30d expire. Publish, voter display edits, and school logo/name sync
 * expire tags immediately. This lifetime is the missed-webhook backup.
 * next.config sets `cacheLife.default` to the Sanity live-preview
 * profile, which is too short to persist.
 */
export const RANKINGS_CACHE_LIFE = {
  stale: 300,
  revalidate: 604800,
  expire: 2592000,
} as const;

export {
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsDivisionWeeksTag,
  rankingsDivisionYearsTag,
  rankingsInvalidationTags,
  rankingsSportTag,
  rankingsWeekTag,
};

export type LatestPoll = Awaited<
  ReturnType<typeof getFinalRankingsForWeekAndYear>
> & { sport: SportParam };

/**
 * Most recent published poll for a division, or `null` when the division
 * has never been voted on. Own `"use cache"` scope so Sanity publishes do
 * not re-hit Postgres.
 */
export async function getCachedLatestPollWeek({
  sport,
  division,
}: {
  sport: SportParam;
  division: string;
}) {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsDivisionYearsTag(division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const latest = await getLatestFinalRankings({ division });
  return latest ? { year: latest.year, week: latest.week } : null;
}

export async function getCachedLatestPoll({
  sport,
  division,
}: {
  sport: SportParam;
  division: string;
}): Promise<LatestPoll | null> {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsDivisionYearsTag(division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const latest = await getLatestFinalRankings({ division });
  if (!latest) return null;

  try {
    const poll = await getFinalRankingsForWeekAndYear({
      year: latest.year,
      week: latest.week,
      division,
      sport,
    });
    return { ...poll, sport };
  } catch {
    return null;
  }
}

export async function getCachedYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionYearsTag(division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getYearsThatHaveVotes({ division });
}

export async function getCachedWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number;
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionWeeksTag(division, year));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getWeeksThatHaveVotes({ year, division });
}

export async function getCachedFinalRankings({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}) {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedLatestFinalRankings({
  division,
}: {
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionYearsTag(division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getLatestFinalRankings({ division });
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getRankedSchoolSanityIds();
}
