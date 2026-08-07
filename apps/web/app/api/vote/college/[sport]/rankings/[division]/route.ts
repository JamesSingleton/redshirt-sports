import { analytics } from "@redshirt-sports/analytics/server";
import { auth } from "@redshirt-sports/auth/server";
import {
  getPollBySportAndSlug,
  getSchoolsBySanityIds,
  getSportIdBySlug,
  getVoterBallots,
  hasVoterVoted,
  isUserAssignedToPoll,
  resolveWeekIdForLegacyWeek,
  submitBallot,
} from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { voteRequestSchema } from "@/lib/schemas/vote-ballot";
import {
  processBallotSanityIds,
  validateDivision,
  validateSport,
} from "@/lib/vote-ballot";
import { ratelimit } from "@/server/ratelimit";
import { getSeasonInfo } from "@/utils/espn";

function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return new Response(JSON.stringify({ error, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const { sport: sportSlug, division } = await params;
    const validatedSport = validateSport(sportSlug);
    const validatedDivision = validateDivision(division);

    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { success: withinRateLimit } = await ratelimit.limit(
      `vote:${user.userId}`,
    );
    if (!withinRateLimit) {
      return jsonError(
        "Too many vote submissions. Please try again shortly.",
        429,
      );
    }

    const body = await req.json();
    const validatedBody = voteRequestSchema.parse(body);

    if (validatedBody.sport && validatedBody.sport !== validatedSport) {
      return jsonError(
        `Sport mismatch: URL has '${validatedSport}' but request has '${validatedBody.sport}'`,
        400,
      );
    }

    if (
      validatedBody.division &&
      validatedBody.division !== validatedDivision
    ) {
      return jsonError(
        `Division mismatch: URL has '${validatedDivision}' but request has '${validatedBody.division}'`,
        400,
      );
    }

    const sportId = await getSportIdBySlug(validatedSport);
    if (!sportId) {
      throw new Error(`Sport not found: ${validatedSport}`);
    }

    const pollSlug = validatedBody.division || validatedDivision;
    const poll = await getPollBySportAndSlug({
      sportId,
      slug: pollSlug,
    });
    if (!poll) {
      return jsonError(`Poll not found: ${pollSlug}`, 404);
    }
    if (!poll.isActive) {
      return jsonError("This poll is not currently accepting ballots", 403);
    }

    const assigned = await isUserAssignedToPoll({
      pollId: poll.id,
      userId: user.userId,
    });
    if (!assigned) {
      return jsonError("You are not assigned as a voter for this poll", 403);
    }

    const seasonInfo = await getSeasonInfo(validatedSport);
    const { year, currentWeek: votingWeek } = seasonInfo;

    if (
      !seasonInfo.isPreseason &&
      !seasonInfo.isRegularSeason &&
      !seasonInfo.isPostseason
    ) {
      return jsonError(
        "Voting is only allowed during preseason, regular season, or postseason",
        400,
        { currentPeriod: "off-season" },
      );
    }

    const weekId = await resolveWeekIdForLegacyWeek({
      sportId,
      year,
      legacyWeek: votingWeek,
    });
    if (!weekId) {
      return jsonError(
        `Unable to resolve week for year=${year} week=${votingWeek}`,
        400,
      );
    }

    const sanityEntries = processBallotSanityIds(validatedBody);

    const alreadyVoted = await hasVoterVoted({
      year,
      week: votingWeek,
      division: pollSlug,
      sportId,
      userId: user.userId,
    });
    if (alreadyVoted) {
      return jsonError("You have already voted for this week", 409);
    }

    const schoolBySanityId = await getSchoolsBySanityIds(
      sanityEntries.map((e) => e.sanityId),
    );

    const entries = [];
    for (const entry of sanityEntries) {
      const school = schoolBySanityId.get(entry.sanityId);
      if (!school) {
        return jsonError(`Unknown school id on ballot: ${entry.sanityId}`, 400);
      }
      if (school.top25Eligible === false) {
        return jsonError(
          `School is not eligible for Top 25 voting: ${entry.sanityId}`,
          400,
        );
      }
      entries.push({
        schoolId: school.id,
        rank: entry.rank,
        points: entry.points,
      });
    }

    await submitBallot({
      pollId: poll.id,
      userId: user.userId,
      weekId,
      entries,
    });

    analytics?.capture({
      distinctId: user.userId,
      event: "ballot_submitted",
      properties: {
        sport: validatedSport,
        division: pollSlug,
        week: votingWeek,
        year,
        vote_count: entries.length,
        season_type: seasonInfo.isPreseason
          ? "preseason"
          : seasonInfo.isPostseason
            ? "postseason"
            : "regular_season",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vote submitted successfully",
        sport: validatedSport,
        division: pollSlug,
        week: votingWeek,
        year,
        voteCount: entries.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    Sentry.captureException(error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Internal server error", 500);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const { sport: sportSlug, division } = await params;
    const validatedSport = validateSport(sportSlug);
    const validatedDivision = validateDivision(division);

    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sportId = await getSportIdBySlug(validatedSport);
    if (!sportId) {
      throw new Error(`Sport not found: ${validatedSport}`);
    }

    const poll = await getPollBySportAndSlug({
      sportId,
      slug: validatedDivision,
    });
    if (!poll) {
      return jsonError(`Poll not found: ${validatedDivision}`, 404);
    }
    if (!poll.isActive) {
      return jsonError("This poll is not currently accepting ballots", 403);
    }

    const assigned = await isUserAssignedToPoll({
      pollId: poll.id,
      userId: user.userId,
    });
    if (!assigned) {
      return jsonError("You are not assigned as a voter for this poll", 403);
    }

    const seasonInfo = await getSeasonInfo(validatedSport);
    const { year, currentWeek: votingWeek } = seasonInfo;

    const existingVote = await getVoterBallots({
      userId: user.userId,
      sportId,
      division: validatedDivision,
      week: votingWeek,
      year,
    });

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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    Sentry.captureException(error);
    console.error("Vote retrieval error:", error);

    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Internal server error", 500);
  }
}
