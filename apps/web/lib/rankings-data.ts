import type { SportParam } from "@redshirt-sports/clients/espn";
import {
  countBallotsForPollWeek,
  getBallotsListedBySanityIdForPollWeek,
  getFinalRankingsForLegacyWeeksInYear,
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getLatestFinalRankingsBySportSlug,
  getPollBySportSlugAndPollSlug,
  getPollVoterBallotStatsForSeason,
  getPollWeekVoterChips,
  getRankedSchoolSanityIds,
  getSchoolRankingHistory,
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  listActivePollVoters,
  resolvePollWeekBySlugs,
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

/**
 * Every Postgres-backed reader in the web app uses `"use cache: remote"`, not
 * plain `"use cache"`. Plain `"use cache"` is per-instance memory on Vercel,
 * so each page regeneration on a fresh instance re-ran its queries. On
 * 2026-11-05 one Sanity edit staled ~40 team pages at once and their
 * background regenerations filled all 200 Supavisor connections (EMAXCONN).
 * The remote cache is shared across instances, so a regeneration reads
 * rankings and ratings from it and Postgres sees one query per entry.
 *
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

export async function getCachedYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  "use cache: remote";
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
  "use cache: remote";
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
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedFinalRankingsForLegacyWeeksInYear({
  year,
  division,
  sport,
  legacyWeeks,
}: {
  year: number;
  division: string;
  sport: SportParam;
  legacyWeeks: number[];
}) {
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsDivisionWeeksTag(division, year),
  );
  cacheLife(RANKINGS_CACHE_LIFE);
  return getFinalRankingsForLegacyWeeksInYear({
    year,
    division,
    sport,
    legacyWeeks,
  });
}

export async function getCachedLatestFinalRankings({
  division,
}: {
  division: string;
}) {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionYearsTag(division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getLatestFinalRankings({ division });
}

/**
 * Latest published week for one sport's poll, for the stable
 * `/college/{sport}/rankings/{poll}` page. Tagged with the poll's division
 * tag, which publish/unpublish expire, so the page moves to a new week as
 * soon as it is published.
 */
export async function getCachedLatestPublishedPoll({
  sport,
  division,
}: {
  sport: string;
  division: string;
}) {
  "use cache: remote";
  cacheTag(rankingsDivisionTag(sport, division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return (await getLatestFinalRankings({ division, sport })) ?? null;
}

export async function getCachedLatestFinalRankingsBySportSlug(
  sportSlug: string,
) {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG, rankingsSportTag(sportSlug));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getLatestFinalRankingsBySportSlug(sportSlug);
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getRankedSchoolSanityIds();
}

export type PollWeekBallotContext = {
  ballotsCounted: number;
  ballotsListedBySanityId: Record<string, number>;
  voterChips: Array<{ id: string; label: string }>;
};

export async function getCachedPollWeekBallotContext({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}): Promise<PollWeekBallotContext | null> {
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const resolved = await resolvePollWeekBySlugs({
    sport,
    division,
    year,
    legacyWeek: week,
  });
  if (!resolved?.weekId) {
    return null;
  }
  const { poll, weekId } = resolved;

  const [ballotsCounted, listedMap, voterChips] = await Promise.all([
    countBallotsForPollWeek({ pollId: poll.id, weekId }),
    getBallotsListedBySanityIdForPollWeek({ pollId: poll.id, weekId }),
    getPollWeekVoterChips({ pollId: poll.id, weekId }),
  ]);

  return {
    ballotsCounted,
    ballotsListedBySanityId: Object.fromEntries(listedMap),
    voterChips,
  };
}

export async function getCachedVotesForWeekAndYearByVoter({
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
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    return null;
  }

  return getVotesForWeekAndYearByVoter({
    year,
    week,
    division,
    sportId,
  });
}

export async function getCachedActivePollVoters({
  division,
  sport,
}: {
  division: string;
  sport: SportParam;
}) {
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const poll = await getPollBySportSlugAndPollSlug({
    sportSlug: sport,
    pollSlug: division,
  });
  if (!poll) {
    return [];
  }

  return listActivePollVoters(poll.id);
}

export async function getCachedPollVoterBallotStatsForSeason({
  division,
  sport,
  year,
}: {
  division: string;
  sport: SportParam;
  year: number;
}) {
  "use cache: remote";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsDivisionYearsTag(division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const poll = await getPollBySportSlugAndPollSlug({
    sportSlug: sport,
    pollSlug: division,
  });
  if (!poll) {
    return new Map();
  }

  return getPollVoterBallotStatsForSeason({ pollId: poll.id, year });
}
