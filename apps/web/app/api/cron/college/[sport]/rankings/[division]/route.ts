import { db } from '@/server/db'
import { weeklyFinalRankings } from '@redshirt-sports/db/schema'
import { client } from '@redshirt-sports/sanity/client'
import { schoolsByIdOrderedByPoints } from '@redshirt-sports/sanity/queries'
import { token } from '@redshirt-sports/sanity/token'
import {
  getCurrentSeasonStartAndEnd,
  getSportIdBySlug,
  getBallotsByWeekYearDivisionAndSport,
} from '@redshirt-sports/db/queries'

import { type Ballot, SchoolLite } from '@/types'
import { NextResponse } from 'next/server'
import { getCurrentSeason, getCurrentWeek, SportParam } from '@/utils/espn'

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
  let wasPreviousTeamTied = false

  teamPoints.forEach((team, index) => {
    if (index > 0) {
      if (team.totalPoints === previousPoints) {
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
  })

  return teamPoints
}

type Params = Promise<{ sport: SportParam; division: string }>

// Cron job to calculate rankings and store them in the database
// Runs once a week on Sunday at 11:59 PM PST
export async function GET(request: Request, segmentData: { params: Params }) {
  const { sport, division: divisionParam } = await segmentData.params
  const currentDate = new Date()
  const sportId = await getSportIdBySlug(sport)
  if (!sportId) {
    return NextResponse.json(
      {
        error: `Invalid sport: ${sport}`,
      },
      {
        status: 400,
      },
    )
  }

  const season = await getCurrentSeasonStartAndEnd({
    sportId: sportId,
    year: currentDate.getFullYear(),
  })

  // Return early if the current date is not within the season as there is no use calculating rankings
  if (season && (season.startDate > currentDate || season.endDate < currentDate)) {
    return NextResponse.json({
      response: 'Current date is not within the season',
    })
  }

  const [currentSeason, currentWeek] = await Promise.all([
    await getCurrentSeason(),
    await getCurrentWeek(),
  ])

  try {
    const division = divisionParam
    const votes: Ballot[] = await getBallotsByWeekYearDivisionAndSport({
      year: currentSeason.year,
      week: currentWeek,
      division,
      sportId: sportId || '',
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
        sportId,
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
