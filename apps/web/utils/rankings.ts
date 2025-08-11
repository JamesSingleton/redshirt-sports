import type { Ballot } from '@/types'

export interface TeamPoint {
  id: string
  totalPoints: number
  firstPlaceVotes: number
  rank?: number
  isTie?: boolean
}

/**
 * Reducer function to accumulate team points from votes
 */
export function teamPointsReducer(acc: TeamPoint[], vote: Ballot): TeamPoint[] {
  const team = acc.find((team) => team.id === vote.teamId)
  if (team) {
    team.totalPoints += vote.points
    if (vote.rank === 1) {
      team.firstPlaceVotes++
    }
  } else {
    acc.push({
      id: vote.teamId,
      totalPoints: vote.points,
      firstPlaceVotes: vote.rank === 1 ? 1 : 0,
    })
  }
  return acc
}

/**
 * Process team points from votes and assign rankings with tie handling
 */
export function processTeamPoints(votes: Ballot[]): TeamPoint[] {
  const teamPoints: TeamPoint[] = votes.reduce(teamPointsReducer, [])

  // Sort by total points (descending), then by first place votes (descending)
  teamPoints.sort((a, b) => {
    if (a.totalPoints === b.totalPoints) {
      return b.firstPlaceVotes - a.firstPlaceVotes
    }
    return b.totalPoints - a.totalPoints
  })

  let currentRank = 1
  let previousPoints = teamPoints[0]?.totalPoints
  let previousFirstPlaceVotes = teamPoints[0]?.firstPlaceVotes
  let wasPreviousTeamTied = false

  teamPoints.forEach((team, index) => {
    if (index > 0) {
      if (team.totalPoints === previousPoints && team.firstPlaceVotes === previousFirstPlaceVotes) {
        // Same rank due to same totalPoints and firstPlaceVotes
        team.isTie = true // Mark current team as tied
        if (!wasPreviousTeamTied) {
          // If the previous team wasn't already marked as tied, find and mark it
          const prevTeam = teamPoints[index - 1]
          if (prevTeam) {
            prevTeam.isTie = true
          }
        }
        wasPreviousTeamTied = true // Mark that this team is part of a tie for the next iteration
      } else {
        currentRank = index + 1 // Update rank if points or firstPlaceVotes differ
        wasPreviousTeamTied = false // Reset tie tracker since this team isn't tied with the next
      }
    } else {
      team.isTie = false // First team can't be in a tie
    }
    team.rank = currentRank // Assign current rank
    previousPoints = team.totalPoints // Update previousPoints for next iteration
    previousFirstPlaceVotes = team.firstPlaceVotes // Update previousFirstPlaceVotes for next iteration
  })

  return teamPoints
}

/**
 * Validate that votes array is not empty and contains valid ballot data
 */
export function validateVotes(votes: Ballot[]): { isValid: boolean; error?: string } {
  if (!votes.length) {
    return { isValid: false, error: 'No votes found for the current week' }
  }

  // Additional validation could be added here (e.g., check for required fields)
  const hasInvalidVotes = votes.some(
    (vote) =>
      !vote.teamId ||
      typeof vote.points !== 'number' ||
      typeof vote.rank !== 'number' ||
      vote.rank < 1 ||
      vote.points < 0,
  )

  if (hasInvalidVotes) {
    return { isValid: false, error: 'Invalid vote data detected' }
  }

  return { isValid: true }
}
