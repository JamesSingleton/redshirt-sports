import { client } from '@/lib/sanity/client'
import { token } from '@/lib/sanity/token'
import { schoolWithVoteOrder } from '@/lib/sanity.queries'

import type { BallotsByVoter, Ballot } from '@/types'

export async function processVoterBallots(userBallots: BallotsByVoter) {
  const voterBallot = []

  for (const userId in userBallots) {
    const userBallot = userBallots[userId]

    if (!userBallot) continue

    const { votes, userData } = userBallot
    const votesWithMoreData = await client.fetch(
      schoolWithVoteOrder,
      {
        ids: votes,
      },
      { token, perspective: 'published' },
    )

    voterBallot.push({
      name: `${userData.firstName} ${userData.lastName}`,
      organization: userData.organization,
      organizationRole: userData.organizationRole,
      ballot: votesWithMoreData,
    })
  }

  return voterBallot
}

export const transformBallotToTeamIds = (ballot: Ballot[]) => {
  return ballot.map((b: Ballot) => ({ id: b.teamId, rank: b.rank }))
}
