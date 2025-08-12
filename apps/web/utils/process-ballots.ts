import { client } from '@/lib/sanity/client'
import { token } from '@/lib/sanity/token'

import type { BallotsByVoter, Ballot } from '@/types'

export async function processVoterBallots(userBallots: BallotsByVoter) {
  const voterBallot = []

  // Collect all unique team IDs and their associated votes for batch fetching
  const allTeamIds = new Set<string>()
  const voterVotesMap = new Map<string, Array<{ teamId: string; rank: number }>>()

  // First pass: collect all team IDs and organize votes by user
  for (const userId in userBallots) {
    const userBallot = userBallots[userId]
    if (!userBallot) continue

    const { votes } = userBallot
    const votesForQuery = votes.map((vote: any) => ({
      teamId: vote.teamId,
      rank: vote.rank,
    }))

    voterVotesMap.set(userId, votesForQuery)
    votes.forEach((vote: any) => allTeamIds.add(vote.teamId))
  }

  // Batch fetch all school data in one query
  const allTeamIdsArray = Array.from(allTeamIds)
  const allSchoolsData =
    allTeamIdsArray.length > 0
      ? await client.fetch(
          `*[_type == "school" && _id in $teamIds]{
          _id,
          name,
          shortName,
          abbreviation,
          image{
            ...,
            "alt": coalesce(asset->altText, caption, asset->originalFilename, "Image-Broken"),
            "credit": coalesce(asset->creditLine, attribution, "Unknown"),
            "blurData": asset->metadata.lqip,
            "dominantColor": asset->metadata.palette.dominant.background,
          }
        }`,
          { teamIds: allTeamIdsArray },
          { token, perspective: 'published' },
        )
      : []

  // Create a map for quick school lookups
  const schoolMap = new Map<string, any>()
  allSchoolsData.forEach((school: any) => {
    schoolMap.set(school._id, school)
  })

  // Second pass: build voter ballots with school data
  for (const userId in userBallots) {
    const userBallot = userBallots[userId]
    if (!userBallot) continue

    const { userData } = userBallot
    const votes = voterVotesMap.get(userId) || []

    // Map votes to include school data and maintain rank order
    const votesWithMoreData = votes
      .map((vote) => {
        const schoolData = schoolMap.get(vote.teamId)
        return schoolData
          ? {
              ...schoolData,
              _order: vote.rank,
            }
          : null
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a._order - b._order)

    voterBallot.push({
      name: `${userData.firstName} ${userData.lastName}`,
      organization: userData.organization,
      organizationRole: userData.organizationRole,
      ballot: votesWithMoreData,
    })
  }

  // Sort by organization first, then alphabetically by name within each organization
  return voterBallot.sort((a, b) => {
    // First compare by organization
    const orgComparison = (a.organization || '').localeCompare(b.organization || '')
    if (orgComparison !== 0) {
      return orgComparison
    }
    // If organizations are the same, compare by name
    return a.name.localeCompare(b.name)
  })
}

export const transformBallotToTeamIds = (ballot: Ballot[]) => {
  return ballot.map((b: Ballot) => ({ id: b.teamId, rank: b.rank }))
}
