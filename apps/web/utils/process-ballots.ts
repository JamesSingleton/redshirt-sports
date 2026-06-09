import { client } from "@redshirt-sports/sanity/client";
import { schoolsByIdsQuery } from "@redshirt-sports/sanity/queries";
import { token } from "@redshirt-sports/sanity/token";
import type { SanityImageAsset } from "@redshirt-sports/sanity/types";

import type {
  Ballot,
  BallotsByVoter,
  VoterBreakdown,
  VoteWithExtraData,
} from "@/types";

type SchoolRecord = {
  _id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  image: SanityImageAsset;
};

export async function processVoterBallots(
  userBallots: BallotsByVoter,
): Promise<VoterBreakdown[]> {
  const teamIds = new Set<string>();

  for (const userId in userBallots) {
    const userBallot = userBallots[userId];
    if (!userBallot) continue;

    for (const vote of userBallot.votes) {
      teamIds.add(vote.teamId);
    }
  }

  if (teamIds.size === 0) {
    return [];
  }

  const schools = await client.fetch<SchoolRecord[]>(
    schoolsByIdsQuery,
    { ids: [...teamIds] },
    { token, perspective: "published" },
  );

  const schoolById = new Map(schools.map((school) => [school._id, school]));
  const voterBallot: VoterBreakdown[] = [];

  for (const userId in userBallots) {
    const userBallot = userBallots[userId];
    if (!userBallot) continue;

    const { userData } = userBallot;
    const votesWithMoreData = userBallot.votes
      .map((vote) => {
        const school = schoolById.get(vote.teamId);
        if (!school) return null;

        return {
          ...school,
          _order: vote.rank,
        } satisfies VoteWithExtraData;
      })
      .filter((vote): vote is VoteWithExtraData => vote !== null)
      .sort((a, b) => a._order - b._order);

    voterBallot.push({
      name: `${userData.firstName} ${userData.lastName}`,
      organization: userData.organization,
      organizationRole: userData.organizationRole,
      ballot: votesWithMoreData,
    });
  }

  return voterBallot;
}

export const transformBallotToTeamIds = (ballot: Ballot[]) => {
  return ballot.map((b: Ballot) => ({ id: b.teamId, rank: b.rank }));
};
