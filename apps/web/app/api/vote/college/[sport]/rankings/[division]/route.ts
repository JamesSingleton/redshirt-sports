import { auth } from "@clerk/nextjs/server";
import { analytics } from "@redshirt-sports/analytics/server";
import { hasVoterPollAssignment } from "@redshirt-sports/db/queries";
import { schoolsTable, voterBallots } from "@redshirt-sports/db/schema";
import * as Sentry from "@sentry/nextjs";
import { inArray } from "drizzle-orm";
import { z } from "zod";

import { getCachedSportIdBySlug } from "@/lib/cached-sport";
import { db } from "@/server/db";
import { ratelimit } from "@/server/ratelimit";
import { getSeasonInfo, type SportParam } from "@/utils/espn";

// Validation schemas - both sport and division come from request body
const VoteRequestSchema = z.object({
  division: z
    .enum(["fbs", "fcs", "d2", "d3", "mid-major", "power-conferences"])
    .optional(),
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
});

type VoteRequest = z.infer<typeof VoteRequestSchema>;

// Sport mapping for URL parameters
const SPORT_SLUG_MAP: Record<string, SportParam> = {
  football: "football",
  "mens-basketball": "mens-basketball",
  "womens-basketball": "womens-basketball",
};

// Division validation
const VALID_DIVISIONS = [
  "fbs",
  "fcs",
  "d2",
  "d3",
  "mid-major",
  "power-conferences",
] as const;
type ValidDivision = (typeof VALID_DIVISIONS)[number];

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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
  const ballot = [];

  for (let i = 1; i <= 25; i++) {
    const rankKey = `rank_${i}` as keyof VoteRequest;
    const teamId = body[rankKey];

    if (teamId && typeof teamId === "string") {
      ballot.push({
        userId,
        sportId,
        division,
        week,
        year,
        teamId,
        rank: i,
        points: 26 - i,
      });
    }
  }

  return ballot;
}

/**
 * Validate sport parameter
 */
function validateSport(sport: string): SportParam {
  const validSport = SPORT_SLUG_MAP[sport];
  if (!validSport) {
    throw new Error(
      `Invalid sport: ${sport}. Must be one of: ${Object.keys(SPORT_SLUG_MAP).join(", ")}`,
    );
  }
  return validSport;
}

/**
 * Validate division parameter
 */
function validateDivision(division: string): ValidDivision {
  if (!VALID_DIVISIONS.includes(division as ValidDivision)) {
    throw new Error(
      `Invalid division: ${division}. Must be one of: ${VALID_DIVISIONS.join(", ")}`,
    );
  }
  return division as ValidDivision;
}

/**
 * Get sport ID from database
 */
async function getSportId(sportSlug: string): Promise<string> {
  const sportId = await getCachedSportIdBySlug(sportSlug as SportParam);
  if (!sportId) {
    throw new Error(`Sport not found: ${sportSlug}`);
  }
  return sportId;
}

async function assertVoterAccess({
  userId,
  isVoter,
  sportId,
  division,
}: {
  userId: string;
  isVoter?: boolean;
  sportId: string;
  division: string;
}) {
  if (!isVoter) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const hasAssignment = await hasVoterPollAssignment({
    userId,
    sportId,
    division,
  });

  if (!hasAssignment) {
    return jsonResponse(
      { error: "You are not assigned to vote for this poll" },
      403,
    );
  }

  return null;
}

async function applyRateLimit(userId: string) {
  try {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
      return jsonResponse({ error: "Too many requests" }, 429);
    }
  } catch {
    // Skip rate limiting when Upstash env is missing or Redis is unavailable
  }

  return null;
}

async function assertEligibleTeamIds(teamIds: string[]) {
  if (teamIds.length === 0) return null;

  const schools = await db
    .select({
      sanityId: schoolsTable.sanityId,
      top25Eligible: schoolsTable.top25Eligible,
    })
    .from(schoolsTable)
    .where(inArray(schoolsTable.sanityId, teamIds));

  const validIds = new Set(
    schools
      .filter((school) => school.sanityId && school.top25Eligible !== false)
      .map((school) => school.sanityId as string),
  );

  const invalidTeamIds = teamIds.filter((teamId) => !validIds.has(teamId));
  if (invalidTeamIds.length > 0) {
    return jsonResponse(
      {
        error: "One or more teams are not eligible for Top 25 voting",
        invalidTeamIds,
      },
      400,
    );
  }

  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    // Parse and validate parameters
    const { sport: sportSlug, division } = await params;
    const validatedSport = validateSport(sportSlug);
    const validatedDivision = validateDivision(division);

    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sportId = await getSportId(validatedSport);

    const accessError = await assertVoterAccess({
      userId: user.userId,
      isVoter: user.sessionClaims?.metadata?.isVoter,
      sportId,
      division: validatedDivision,
    });
    if (accessError) return accessError;

    const rateLimitError = await applyRateLimit(user.userId);
    if (rateLimitError) return rateLimitError;

    // Validate request body
    const body = await req.json();
    const validatedBody = VoteRequestSchema.parse(body);

    // Validate that request body matches URL parameters
    if (validatedBody.sport && validatedBody.sport !== validatedSport) {
      return jsonResponse(
        {
          error: `Sport mismatch: URL has '${validatedSport}' but request has '${validatedBody.sport}'`,
        },
        400,
      );
    }

    if (
      validatedBody.division &&
      validatedBody.division !== validatedDivision
    ) {
      return jsonResponse(
        {
          error: `Division mismatch: URL has '${validatedDivision}' but request has '${validatedBody.division}'`,
        },
        400,
      );
    }

    // Get current season info for the specific sport
    const seasonInfo = await getSeasonInfo(validatedSport);
    const { year, currentWeek: votingWeek } = seasonInfo;

    // Validate that we're in a voting period (preseason, regular season, or postseason)
    if (
      !seasonInfo.isPreseason &&
      !seasonInfo.isRegularSeason &&
      !seasonInfo.isPostseason
    ) {
      return jsonResponse(
        {
          error:
            "Voting is only allowed during preseason, regular season, or postseason",
          currentPeriod: "off-season",
        },
        400,
      );
    }

    const ballotDivision = validatedBody.division || validatedDivision;

    // Process ballot data - use division from request body with fallback to URL params
    const ballot = processBallotData(
      validatedBody,
      user.userId,
      sportId,
      ballotDivision,
      year,
      votingWeek,
    );

    // Validate that we have at least one vote
    if (ballot.length === 0) {
      return jsonResponse({ error: "At least one team must be ranked" }, 400);
    }

    const eligibilityError = await assertEligibleTeamIds(
      ballot.map((entry) => entry.teamId),
    );
    if (eligibilityError) return eligibilityError;

    // Check for duplicate votes (same user, sport, division, week, year)
    const existingVote = await db.query.voterBallots.findFirst({
      where: (model, { eq, and }) =>
        and(
          eq(model.userId, user.userId),
          eq(model.sportId, sportId),
          eq(model.division, ballotDivision),
          eq(model.week, votingWeek),
          eq(model.year, year),
        ),
    });

    if (existingVote) {
      return jsonResponse(
        { error: "You have already voted for this week" },
        409,
      );
    }

    // Insert ballot into database
    await db.insert(voterBallots).values(ballot);

    // Capture ballot_submitted event with PostHog
    analytics?.capture({
      distinctId: user.userId,
      event: "ballot_submitted",
      properties: {
        sport: validatedSport,
        division: ballotDivision,
        week: votingWeek,
        year,
        vote_count: ballot.length,
        season_type: seasonInfo.isPreseason
          ? "preseason"
          : seasonInfo.isPostseason
            ? "postseason"
            : "regular_season",
      },
    });

    return jsonResponse(
      {
        success: true,
        message: "Vote submitted successfully",
        sport: validatedSport,
        division: ballotDivision,
        week: votingWeek,
        year,
        voteCount: ballot.length,
      },
      200,
    );
  } catch (error) {
    Sentry.captureException(error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return jsonResponse(
        {
          error: "Invalid request data",
          details: error.format(),
        },
        400,
      );
    }

    // Handle other known errors
    if (error instanceof Error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    // Parse and validate parameters
    const { sport: sportSlug, division } = await params;
    const validatedSport = validateSport(sportSlug);
    const validatedDivision = validateDivision(division);

    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get sport ID from database
    const sportId = await getSportId(validatedSport);

    const accessError = await assertVoterAccess({
      userId: user.userId,
      isVoter: user.sessionClaims?.metadata?.isVoter,
      sportId,
      division: validatedDivision,
    });
    if (accessError) return accessError;

    // Get current season info
    const seasonInfo = await getSeasonInfo(validatedSport);
    const { year, currentWeek: votingWeek } = seasonInfo;

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
    });

    return jsonResponse(
      {
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
      },
      200,
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error("Vote retrieval error:", error);

    if (error instanceof Error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
