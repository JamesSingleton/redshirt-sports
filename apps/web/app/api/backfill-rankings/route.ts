import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { weeklyFinalRankings } from '@/server/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { getSportIdBySlug } from '@/server/queries'

// Same calculation function as in the migration script
function calculateTrendsForWeek(currentWeekRankings: any[], previousWeekRankings: any[]) {
  const isStartOfSeason = previousWeekRankings.length === 0

  // Create map of previous week rankings
  const previousRankMap = new Map<string, number>()
  previousWeekRankings.forEach((team) => {
    if (team.rank && team.rank <= 25) {
      previousRankMap.set(team._id, team.rank)
    }
  })

  return currentWeekRankings.map((team) => {
    const currentRank = team.rank || 0
    const currentIsRanked = currentRank <= 25 && currentRank > 0
    const previousRank = previousRankMap.get(team._id)
    const previousWasRanked = !!previousRank

    let rankChange = 0
    let isNewlyRanked = false
    let droppedOut = false
    let storePreviousRank: number | null = null

    if (isStartOfSeason) {
      // First week of season - no previous data
      rankChange = 0
      isNewlyRanked = false
      droppedOut = false
      storePreviousRank = null
    } else {
      // Set previous rank if they were ranked
      if (previousRank) {
        storePreviousRank = previousRank
      }

      if (previousWasRanked && currentIsRanked) {
        // Both weeks ranked (1-25) - calculate movement
        rankChange = previousRank! - currentRank
      } else if (!previousWasRanked && currentIsRanked) {
        // Previously unranked, now ranked
        isNewlyRanked = true
        rankChange = 0
        storePreviousRank = null
      } else if (previousWasRanked && !currentIsRanked) {
        // Previously ranked, now unranked
        droppedOut = true
        rankChange = 0
        storePreviousRank = previousRank!
      } else {
        // Both weeks unranked
        rankChange = 0
        storePreviousRank = previousRank || null
      }
    }

    return {
      ...team,
      previousRank: storePreviousRank,
      rankChange,
      isNewlyRanked,
      droppedOut,
    }
  })
}

// export async function POST(request: Request) {
//   try {
//     const { sport, division, year, dryRun = false } = await request.json()

//     // Build query conditions
//     const conditions = []
//     if (sport) conditions.push(eq(weeklyFinalRankings.sportId, sport))
//     if (division) conditions.push(eq(weeklyFinalRankings.division, division))
//     if (year) conditions.push(eq(weeklyFinalRankings.year, year))

//     const whereClause = conditions.length > 0 ? and(...conditions) : undefined

//     // Get rankings to process
//     const rankingsToProcess = await db
//       .select()
//       .from(weeklyFinalRankings)
//       .where(whereClause)
//       .orderBy(
//         asc(weeklyFinalRankings.year),
//         asc(weeklyFinalRankings.week),
//         asc(weeklyFinalRankings.division),
//         asc(weeklyFinalRankings.sportId),
//       )

//     console.log(`Found ${rankingsToProcess.length} records to process`)

//     // Group and process (similar to migration script logic)
//     const groupedRankings = new Map<string, any[]>()

//     rankingsToProcess.forEach((ranking) => {
//       const key = `${ranking.sportId}-${ranking.division}-${ranking.year}`
//       if (!groupedRankings.has(key)) {
//         groupedRankings.set(key, [])
//       }
//       groupedRankings.get(key)!.push(ranking)
//     })

//     let processedCount = 0
//     let updatedCount = 0
//     const results = []

//     for (const [key, rankings] of groupedRankings) {
//       rankings.sort((a, b) => a.week - b.week)

//       for (let i = 0; i < rankings.length; i++) {
//         const currentRanking = rankings[i]
//         const previousRanking = i > 0 ? rankings[i - 1] : null

//         const updatedRankings = calculateTrendsForWeek(
//           currentRanking.rankings,
//           previousRanking?.rankings || [],
//         )

//         const hasExistingTrends = currentRanking.rankings.some(
//           (team: any) => 'previousRank' in team || 'rankChange' in team,
//         )

//         if (!hasExistingTrends) {
//           if (!dryRun) {
//             await db
//               .update(weeklyFinalRankings)
//               .set({ rankings: updatedRankings })
//               .where(eq(weeklyFinalRankings.id, currentRanking.id))
//           }

//           updatedCount++
//           results.push({
//             action: dryRun ? 'would_update' : 'updated',
//             key,
//             week: currentRanking.week,
//           })
//         } else {
//           results.push({
//             action: 'skipped',
//             key,
//             week: currentRanking.week,
//             reason: 'already_has_trends',
//           })
//         }

//         processedCount++
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       processed: processedCount,
//       updated: updatedCount,
//       skipped: processedCount - updatedCount,
//       dryRun,
//       results,
//     })
//   } catch (error) {
//     console.error('Backfill error:', error)
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
//   }
// }

// GET endpoint to calculate and return updated rankings (no DB changes)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const division = searchParams.get('division')
  const year = searchParams.get('year')
  const week = searchParams.get('week')

  try {
    const conditions = []
    const sportId = await getSportIdBySlug(sport)
    if (sportId) conditions.push(eq(weeklyFinalRankings.sportId, sportId))
    if (division) conditions.push(eq(weeklyFinalRankings.division, division))
    if (year) conditions.push(eq(weeklyFinalRankings.year, parseInt(year)))
    if (week) conditions.push(eq(weeklyFinalRankings.week, parseInt(week)))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rankingsToProcess = await db
      .select()
      .from(weeklyFinalRankings)
      .where(whereClause)
      .orderBy(
        asc(weeklyFinalRankings.year),
        asc(weeklyFinalRankings.week),
        asc(weeklyFinalRankings.division),
        asc(weeklyFinalRankings.sportId),
      )

    if (rankingsToProcess.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No rankings found matching the criteria',
        filters: { sport, division, year, week },
      })
    }

    // Group by sport-division-year for processing
    const groupedRankings = new Map<string, any[]>()

    rankingsToProcess.forEach((ranking) => {
      const key = `${ranking.sportId}-${ranking.division}-${ranking.year}`
      if (!groupedRankings.has(key)) {
        groupedRankings.set(key, [])
      }
      groupedRankings.get(key)!.push(ranking)
    })

    const processedGroups = []

    for (const [key, rankings] of groupedRankings) {
      rankings.sort((a, b) => a.week - b.week)
      const processedWeeks = []

      for (let i = 0; i < rankings.length; i++) {
        const currentRanking = rankings[i]
        const previousRanking = i > 0 ? rankings[i - 1] : null

        // Calculate trends for this week
        const updatedRankings = calculateTrendsForWeek(
          currentRanking.rankings,
          previousRanking?.rankings || [],
        )

        processedWeeks.push({
          week: currentRanking.week,
          originalRankings: currentRanking.rankings,
          updatedRankings: updatedRankings,
          hasExistingTrends: currentRanking.rankings.some(
            (team: any) => 'previousRank' in team || 'rankChange' in team,
          ),
        })
      }

      processedGroups.push({
        key,
        sportId: rankings[0].sportId,
        division: rankings[0].division,
        year: rankings[0].year,
        weeks: processedWeeks,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Rankings processed (no database changes made)',
      totalRecords: rankingsToProcess.length,
      filters: { sport, division, year, week },
      groups: processedGroups,
    })
  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
