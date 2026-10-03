import {
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
} from "@redshirt-sports/db/queries";
import { cacheLife, cacheTag } from "next/cache";

import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import {
  type ConsensusRank,
  computeBallotMatchPercent,
} from "@/lib/ballot-match";
import {
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
  rankingsWeekTag,
} from "@/lib/rankings-data";
import type { VoterBreakdownData } from "@/types/votes";
import type { SportParam } from "@/utils/espn";
import { processVoterBallots } from "@/utils/process-ballots";

export type RankingsVoterBreakdownProps = {
  division: string;
  year: number;
  week: number;
  sport: SportParam;
  consensusRanks: ConsensusRank[];
};

/**
 * Ballot rows only — keep `consensusRanks` out of the cache key so a new
 * array identity from the page does not bust this on every request.
 */
async function getCachedVoterBallots({
  division,
  year,
  week,
  sport,
}: Omit<RankingsVoterBreakdownProps, "consensusRanks">) {
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

  const votesForWeekAndYearByVoter = await getVotesForWeekAndYearByVoter({
    year,
    week,
    division,
    sportId,
  });

  const processed = await processVoterBallots(votesForWeekAndYearByVoter);
  if (processed.voters.length === 0) {
    return null;
  }

  return processed;
}

/**
 * Must run under `'use cache'` (via {@link getCachedVoterBallots}). Uncached
 * DB/Sanity I/O here races layout cache fills against the shared postgres
 * pool and deadlocks CachedNavbarServer.
 */
export async function getCachedVoterBreakdown({
  consensusRanks,
  ...ballotParams
}: RankingsVoterBreakdownProps): Promise<VoterBreakdownData | null> {
  const ballots = await getCachedVoterBallots(ballotParams);
  if (!ballots) {
    return null;
  }

  return {
    teams: ballots.teams,
    voters: ballots.voters.map((voter) => ({
      ...voter,
      matchPercent: computeBallotMatchPercent(voter.ballot, consensusRanks),
    })),
  };
}

export async function RankingsVoterBreakdown(
  props: RankingsVoterBreakdownProps,
) {
  const voterBreakdown = await getCachedVoterBreakdown(props);
  if (!voterBreakdown) {
    return null;
  }

  return (
    <VoterBallotBreakdown
      voterBreakdown={voterBreakdown.voters}
      teams={voterBreakdown.teams}
    />
  );
}
