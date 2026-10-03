import { client } from "@redshirt-sports/sanity/client";
import { schoolsByIdsQuery } from "@redshirt-sports/sanity/queries";
import { token } from "@redshirt-sports/sanity/token";

import type {
  Ballot,
  BallotsByVoter,
  BallotTeam,
  BallotTeamsById,
  VoterBreakdown,
} from "@/types";

export type ProcessedVoterBallots = {
  voters: Omit<VoterBreakdown, "matchPercent">[];
  teams: BallotTeamsById;
};

export async function processVoterBallots(
  userBallots: BallotsByVoter,
): Promise<ProcessedVoterBallots> {
  const teamIds = new Set<string>();

  for (const userId in userBallots) {
    const userBallot = userBallots[userId];
    if (!userBallot) continue;

    for (const vote of userBallot.votes) {
      teamIds.add(vote.teamId);
    }
  }

  if (teamIds.size === 0) {
    return { voters: [], teams: {} };
  }

  const schools = await client.fetch<BallotTeam[]>(
    schoolsByIdsQuery,
    { ids: [...teamIds] },
    { token, perspective: "published" },
  );

  const teams: BallotTeamsById = {};
  for (const school of schools) {
    teams[school._id] = school;
  }

  const voters: ProcessedVoterBallots["voters"] = [];

  for (const userId in userBallots) {
    const userBallot = userBallots[userId];
    if (!userBallot) continue;

    const { userData } = userBallot;
    if (!userData) continue;

    const ballot = userBallot.votes
      .filter((vote) => vote.teamId in teams)
      .sort((a, b) => a.rank - b.rank)
      .map((vote) => vote.teamId);

    voters.push({
      name: `${userData.firstName} ${userData.lastName}`,
      organization: userData.organization ?? "",
      organizationRole: userData.organizationRole ?? "",
      ballot,
    });
  }

  return { voters, teams };
}

export const transformBallotToTeamIds = (ballot: Ballot[]) => {
  return ballot.map((b: Ballot) => ({ id: b.teamId, rank: b.rank }));
};
