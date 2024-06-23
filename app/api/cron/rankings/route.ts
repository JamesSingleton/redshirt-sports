import { db } from '@/server/db'
import { weeklyFinalRankings } from '@/server/db/schema'
import { getAllBallotsForWeekAndYear } from '@/server/queries'
import { client } from '@/lib/sanity.client'
import { schoolsByIdOrderedByPoints } from '@/lib/sanity.queries'
import { token } from '@/lib/sanity.fetch'

import { type Ballot, SchoolLite } from '@/types'

interface TeamPoint {
  id: string
  totalPoints: number
  firstPlaceVotes: number
  rank?: number
  isTie?: boolean
}

function teamPointsReducer(acc: TeamPoint[], vote: Ballot): TeamPoint[] {
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

function processTeamPoints(votes: Ballot[]): TeamPoint[] {
  const teamPoints: TeamPoint[] = votes.reduce(teamPointsReducer, [])
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
          teamPoints[index - 1].isTie = true
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

// Cron job to calculate rankings and store them in the database
// Runs once a week on Sunday at 11:59 PM PST
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const division = searchParams.get('division') || 'fcs'
    const votes: Ballot[] = await getAllBallotsForWeekAndYear({
      year: parseInt('2024', 10),
      week: parseInt('0', 10),
      division,
    })
    const teamPoints = processTeamPoints(votes)
    const teams = await client.fetch<SchoolLite[]>(
      schoolsByIdOrderedByPoints,
      { ids: teamPoints },
      { token, perspective: 'published' },
    )

    const rankedTeams = teams.map((team) => {
      const teamPoint = teamPoints.find((tp) => tp.id === team._id)
      return {
        ...team,
        rank: teamPoint?.rank,
        firstPlaceVotes: teamPoint?.firstPlaceVotes,
        isTie: teamPoint?.isTie,
      }
    })

    await db.insert(weeklyFinalRankings).values({
      division,
      year: 2024,
      week: 0,
      rankings: rankedTeams,
    })
  } catch (error) {
    console.error(error)
    return { status: 500, body: { error: 'Internal server error' } }
  }
}
