import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { voterBallots, sportsTable } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { getSeasonInfo, type SportParam } from '@/utils/espn'
import { getSportIdBySlug } from '@/server/queries'

// Validation schemas - both sport and division come from request body
const VoteRequestSchema = z.object({
  division: z.enum(['fbs', 'fcs', 'd2', 'd3', 'mid-major', 'power-conferences']).optional(),
  sport: z.string().optional(),
  rank_1: z.string().optional(),
  rank_2: z.string().optional(),
  rank_3: z.string().optional(),
  rank_4: z.string().optional(),
  rank_5: z.string().optional(),
  rank_6: z.string().optional(),
  rank_7: z.string().optional(),
  rank_8: z.string().optional(),
  rank_9: z.string().optional(),
  rank_10: z.string().optional(),
  rank_11: z.string().optional(),
  rank_12: z.string().optional(),
  rank_13: z.string().optional(),
  rank_14: z.string().optional(),
  rank_15: z.string().optional(),
  rank_16: z.string().optional(),
  rank_17: z.string().optional(),
  rank_18: z.string().optional(),
  rank_19: z.string().optional(),
  rank_20: z.string().optional(),
  rank_21: z.string().optional(),
  rank_22: z.string().optional(),
  rank_23: z.string().optional(),
  rank_24: z.string().optional(),
  rank_25: z.string().optional(),
})

type VoteRequest = z.infer<typeof VoteRequestSchema>

// Sport mapping for URL parameters
const SPORT_SLUG_MAP: Record<string, SportParam> = {
  football: 'football',
  'mens-basketball': 'mens-basketball',
  'womens-basketball': 'womens-basketball',
}

// Division validation
const VALID_DIVISIONS = ['fbs', 'fcs', 'd2', 'd3', 'mid-major', 'power-conferences'] as const
type ValidDivision = (typeof VALID_DIVISIONS)[number]

/**
 * Process ballot data and return array of ballot entries
 */
function processBallotData(
  body: VoteRequest,
  userId: string,
  sportId: string,
  division: string,
  year: number,
  week: number,
) {
  const ballot = []

  for (let i = 1; i <= 25; i++) {
    const rankKey = `rank_${i}` as keyof VoteRequest
    const teamId = body[rankKey]

    if (teamId && typeof teamId === 'string') {
      ballot.push({
        userId,
        sportId,
        division,
        week,
        year,
        teamId,
        rank: i,
        points: 26 - i,
      })
    }
  }

  return ballot
}

/**
 * Validate sport parameter
 */
function validateSport(sport: string): SportParam {
  const validSport = SPORT_SLUG_MAP[sport]
  if (!validSport) {
    throw new Error(
      `Invalid sport: ${sport}. Must be one of: ${Object.keys(SPORT_SLUG_MAP).join(', ')}`,
    )
  }
  return validSport
}

/**
 * Validate division parameter
 */
function validateDivision(division: string): ValidDivision {
  if (!VALID_DIVISIONS.includes(division as ValidDivision)) {
    throw new Error(`Invalid division: ${division}. Must be one of: ${VALID_DIVISIONS.join(', ')}`)
  }
  return division as ValidDivision
}

/**
 * Get sport ID from database
 */
async function getSportId(sportSlug: string): Promise<string> {
  const sportId = await getSportIdBySlug(sportSlug as SportParam)
  if (!sportId) {
    throw new Error(`Sport not found: ${sportSlug}`)
  }
  return sportId
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    // Parse and validate parameters
    const { sport: sportSlug, division } = await params
    const validatedSport = validateSport(sportSlug)
    const validatedDivision = validateDivision(division)

    // Authenticate user
    const user = await auth()
    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Validate request body
    const body = await req.json()
    const validatedBody = VoteRequestSchema.parse(body)
    console.log(validatedBody)

    // Validate that request body matches URL parameters
    if (validatedBody.sport && validatedBody.sport !== validatedSport) {
      return new Response(
        JSON.stringify({
          error: `Sport mismatch: URL has '${validatedSport}' but request has '${validatedBody.sport}'`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (validatedBody.division && validatedBody.division !== validatedDivision) {
      return new Response(
        JSON.stringify({
          error: `Division mismatch: URL has '${validatedDivision}' but request has '${validatedBody.division}'`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Get sport ID from database
    const sportId = await getSportId(validatedSport)

    // Get current season info for the specific sport
    const seasonInfo = await getSeasonInfo(validatedSport)
    const { year, currentWeek: votingWeek } = seasonInfo

    // Validate that we're in a voting period (preseason, regular season, or postseason)
    if (!seasonInfo.isPreseason && !seasonInfo.isRegularSeason && !seasonInfo.isPostseason) {
      return new Response(
        JSON.stringify({
          error: 'Voting is only allowed during preseason, regular season, or postseason',
          currentPeriod: 'off-season',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Process ballot data - use division from request body with fallback to URL params
    const ballot = processBallotData(
      validatedBody,
      user.userId,
      sportId,
      validatedBody.division || validatedDivision, // Use request body division with fallback
      year,
      votingWeek,
    )

    // Validate that we have at least one vote
    if (ballot.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one team must be ranked' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check for duplicate votes (same user, sport, division, week, year)
    const existingVote = await db.query.voterBallots.findFirst({
      where: (model, { eq, and }) =>
        and(
          eq(model.userId, user.userId),
          eq(model.sportId, sportId),
          eq(model.division, validatedBody.division || validatedDivision),
          eq(model.week, votingWeek),
          eq(model.year, year),
        ),
    })

    if (existingVote) {
      return new Response(JSON.stringify({ error: 'You have already voted for this week' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(ballot)

    // Insert ballot into database
    await db.insert(voterBallots).values(ballot)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vote submitted successfully',
        sport: validatedSport,
        division: validatedBody.division || validatedDivision,
        week: votingWeek,
        year,
        voteCount: ballot.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('Vote submission error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Handle other known errors
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    // Parse and validate parameters
    const { sport: sportSlug, division } = await params
    const validatedSport = validateSport(sportSlug)
    const validatedDivision = validateDivision(division)

    // Authenticate user
    const user = await auth()
    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get sport ID from database
    const sportId = await getSportId(validatedSport)

    // Get current season info
    const seasonInfo = await getSeasonInfo(validatedSport)
    const { year, currentWeek: votingWeek } = seasonInfo

    // Get user's existing vote for this week
    const existingVote = await db.query.voterBallots.findMany({
      where: (model, { eq, and }) =>
        and(
          eq(model.userId, user.userId),
          eq(model.sportId, sportId),
          eq(model.division, validatedDivision),
          eq(model.week, votingWeek),
          eq(model.year, year),
        ),
      orderBy: (model, { asc }) => [asc(model.rank)],
    })

    return new Response(
      JSON.stringify({
        sport: validatedSport,
        division: validatedDivision,
        week: votingWeek,
        year,
        hasVoted: existingVote.length > 0,
        voteCount: existingVote.length,
        votes: existingVote,
        seasonInfo: {
          isPreseason: seasonInfo.isPreseason,
          isRegularSeason: seasonInfo.isRegularSeason,
          isPostseason: seasonInfo.isPostseason,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    Sentry.captureException(error)
    console.error('Vote retrieval error:', error)

    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
