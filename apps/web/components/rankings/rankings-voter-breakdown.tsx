import {
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
} from "@redshirt-sports/db/queries";

import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import {
  type ConsensusRank,
  computeBallotMatchPercent,
} from "@/lib/ballot-match";
import type { VoterBreakdown } from "@/types/votes";
import type { SportParam } from "@/utils/espn";
import { processVoterBallots } from "@/utils/process-ballots";

type RankingsVoterBreakdownProps = {
  division: string;
  year: number;
  week: number;
  sport: SportParam;
  consensusRanks: ConsensusRank[];
};

/**
 * Must run under `'use cache'`. Uncached DB/Sanity I/O here races layout
 * cache fills against the shared postgres pool and deadlocks CachedNavbarServer.
 */
async function getCachedVoterBreakdown({
  division,
  year,
  week,
  sport,
  consensusRanks,
}: RankingsVoterBreakdownProps): Promise<VoterBreakdown[] | null> {
  "use cache";

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
