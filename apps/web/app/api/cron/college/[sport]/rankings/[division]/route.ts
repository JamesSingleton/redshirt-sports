import { db } from '@/server/db'
import { weeklyFinalRankings } from '@/server/db/schema'
import { getAllBallotsForWeekAndYear } from '@/server/queries'
import { client } from '@/lib/sanity/client'
import { schoolsByIdOrderedByPoints } from '@/lib/sanity.queries'
import { token } from '@/lib/sanity/token'
import { getCurrentSeasonStartAndEnd } from '@/server/queries'

import { type Ballot, SchoolLite } from '@/types'
import { NextResponse } from 'next/server'
import { getCurrentSeason } from '@/utils/getCurrentSeason'
import { getCurrentWeek } from '@/utils/getCurrentWeek'

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

type Params = Promise<{ division: string }>

// Cron job to calculate rankings and store them in the database
// Runs once a week on Sunday at 11:59 PM PST
export async function GET(request: Request, segmentData: { params: Params }) {
  const { division: divisionParam } = await segmentData.params
  const currentDate = new Date()
  const season = await getCurrentSeasonStartAndEnd({ year: currentDate.getFullYear() })
  // Return early if the current date is not within the season as there is no use calculating rankings
  if (season && (season.start > currentDate || season.end < currentDate)) {
    return NextResponse.json({
      response: 'Current date is not within the season',
    })
  }
  const currentSeason = await getCurrentSeason()
  const currentWeek = await getCurrentWeek()

  try {
    const division = divisionParam
    const votes: Ballot[] = await getAllBallotsForWeekAndYear({
      year: currentSeason.year,
      week: currentWeek,
      division,
    })

    if (!votes.length) {
      return NextResponse.json({
        response: 'No votes found for the current week',
      })
    }

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

    await db
      .insert(weeklyFinalRankings)
      .values({
        division,
        year: currentSeason.year,
        week: currentWeek,
        rankings: rankedTeams,
      })
      .onConflictDoUpdate({
        target: [weeklyFinalRankings.division, weeklyFinalRankings.year, weeklyFinalRankings.week],
        set: { rankings: rankedTeams },
      })

    return NextResponse.json({
      response: 'Rankings calculated and stored in the database',
    })
  } catch (error) {
    console.error(error)
    return NextResponse.error()
  }
}
