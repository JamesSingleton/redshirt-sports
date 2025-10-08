'use server'

import { client } from '@redshirt-sports/sanity/client'
import { schoolsByIdOrderedByPoints } from '@redshirt-sports/sanity/queries'
import type { SanityImageAsset } from '@redshirt-sports/sanity/types'
import { token } from '@redshirt-sports/sanity/token'
import {
  upsertWeeklyFinalRankings,
  getBallotsByWeekYearDivisionAndSport,
} from '@redshirt-sports/db/queries'

interface TeamPoint {
  id: string
  totalPoints: number
  firstPlaceVotes: number
  rank?: number
  isTie?: boolean
}

export interface Ballot {
  id: number
  userId: string
  division: string
  week: number
  year: number
  createdAt: Date
  teamId: string
  rank: number
  points: number
}

export interface SchoolLite {
  _id: string
  name: string
  image: SanityImageAsset
  abbreviation: string
  shortName: string
  _points: number
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
        team.isTie = false
      }
    } else {
      team.isTie = false // First team can't be in a tie
    }
    team.rank = currentRank // Assign current rank
    previousPoints = team.totalPoints // Update previousPoints for next iteration
  })

  return teamPoints
}

interface ProcessBallotsInput {
  sportId: string // uuid
  division: string // fcs/fbs/etc
  seasonYear: number // 2025
  weekNumber: number // 3
}

async function processBallots({ sportId, division, seasonYear, weekNumber }: ProcessBallotsInput) {
  try {
    const votes: Ballot[] = await getBallotsByWeekYearDivisionAndSport({
      year: seasonYear,
      week: weekNumber,
      division,
      sportId: sportId || '',
    })

    if (!votes.length) {
      console.error('no votes')
      return
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

    await upsertWeeklyFinalRankings({
      division,
      year: seasonYear,
      week: weekNumber,
      rankings: rankedTeams,
      sportId,
    })
  } catch (error) {
    console.error(error)
  }
}

export async function processBallotsForm(formData: FormData) {
  const sportId = formData.get('sportId')
  const division = formData.get('division')
  const season = formData.get('season')
  const week = formData.get('week')

  if (!sportId || !division || !season || !week) {
    return
  }

  await processBallots({
    sportId: String(sportId),
    division: String(division),
    seasonYear: Number(season),
    weekNumber: Number(week),
  })
}
