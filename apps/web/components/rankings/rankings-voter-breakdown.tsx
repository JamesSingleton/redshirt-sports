import {
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
} from "@redshirt-sports/db/queries";

import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import type { SportParam } from "@/utils/espn";
import { processVoterBallots } from "@/utils/process-ballots";

type RankingsVoterBreakdownProps = {
  division: string;
  year: number;
  week: number;
  sport: SportParam;
};

export async function RankingsVoterBreakdown({
  division,
  year,
  week,
  sport,
}: RankingsVoterBreakdownProps) {
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

  return (
    <div className="mt-8">
      <VoterBallotBreakdown voterBreakdown={voterBreakdown} />
    </div>
  );
}
