import {
  countBallotsForPollWeek,
  getBallotsListedBySanityIdForPollWeek,
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getLatestFinalRankingsBySportSlug,
  getPollBySportAndSlug,
  getPollVoterBallotStatsForSeason,
  getPollWeekVoterChips,
  getRankedSchoolSanityIds,
  getSchoolRankingHistory,
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  listActivePollVoters,
  resolveWeekIdForLegacyWeek,
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

export type NavbarLatestRanking = {
  division: string;
  week: number;
  year: number;
};

export type NavbarLatestRankingsBySport = {
  sport: string;
  divisions: NavbarLatestRanking[];
};

export {
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsDivisionWeeksTag,
  rankingsDivisionYearsTag,
  rankingsInvalidationTags,
  rankingsSportTag,
  rankingsWeekTag,
};

/**
 * Latest rankings week pointers for the navbar.
 * Own `"use cache"` scope so Sanity publishes do not re-hit Postgres.
 * Publish and display-field webhooks bust {@link RANKINGS_CACHE_TAG}.
 */
export async function getCachedNavbarLatestRankings(): Promise<
  NavbarLatestRankingsBySport[]
> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);

  const [latestFootballRankings, latestMensBasketballRankings] =
    await Promise.all([
      getLatestFinalRankingsBySportSlug("football"),
      getLatestFinalRankingsBySportSlug("mens-basketball"),
    ]);

  return [
    { sport: "football", divisions: latestFootballRankings },
    { sport: "mens-basketball", divisions: latestMensBasketballRankings },
  ];
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

export async function getCachedLatestFinalRankingsBySportSlug(
  sportSlug: string,
) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsSportTag(sportSlug));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getLatestFinalRankingsBySportSlug(sportSlug);
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
  "use cache";
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

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) {
    return null;
  }

  const weekId = await resolveWeekIdForLegacyWeek({
    sportId,
    year,
    legacyWeek: week,
  });
  if (!weekId) {
    return null;
  }

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
  "use cache";
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
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    return [];
  }

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
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
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsDivisionYearsTag(division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    return new Map();
  }

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) {
    return new Map();
  }

  return getPollVoterBallotStatsForSeason({ pollId: poll.id, year });
}
