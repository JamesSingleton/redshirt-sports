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
import type { VoterBreakdown } from "@/types/votes";
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

  const voterBreakdown = await processVoterBallots(votesForWeekAndYearByVoter);
  if (voterBreakdown.length === 0) {
    return null;
  }

  return voterBreakdown;
}

/**
 * Must run under `'use cache'` (via {@link getCachedVoterBallots}). Uncached
 * DB/Sanity I/O here races layout cache fills against the shared postgres
 * pool and deadlocks CachedNavbarServer.
 */
export async function getCachedVoterBreakdown({
  consensusRanks,
  ...ballotParams
}: RankingsVoterBreakdownProps): Promise<VoterBreakdown[] | null> {
  const voterBreakdown = await getCachedVoterBallots(ballotParams);
  if (!voterBreakdown) {
    return null;
  }

  return voterBreakdown.map((voter) => ({
    ...voter,
    matchPercent: computeBallotMatchPercent(
      voter.ballot.map((team) => team._id),
      consensusRanks,
    ),
  }));
}

export async function RankingsVoterBreakdown(
  props: RankingsVoterBreakdownProps,
) {
  const voterBreakdown = await getCachedVoterBreakdown(props);
  if (!voterBreakdown) {
    return null;
  }

  return (
    <div className="mt-8">
      <VoterBallotBreakdown voterBreakdown={voterBreakdown} />
    </div>
  );
}
