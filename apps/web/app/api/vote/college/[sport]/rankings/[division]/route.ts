import { analytics } from "@redshirt-sports/analytics/server";
import { auth } from "@redshirt-sports/auth/server";
import {
  getPollBySportAndSlug,
  getSchoolIdsBySanityIds,
  getSportIdBySlug,
  getVoterBallots,
  hasVoterVoted,
  isUserAssignedToPoll,
  resolveWeekIdForLegacyWeek,
  submitBallot,
} from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import {
  processBallotSanityIds,
  validateDivision,
  validateSport,
} from "@/lib/vote-ballot";
import { getSeasonInfo } from "@/utils/espn";

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

    const body = await req.json();
    const validatedBody = VoteRequestSchema.parse(body);

    if (validatedBody.sport && validatedBody.sport !== validatedSport) {
      return new Response(
        JSON.stringify({
          error: `Sport mismatch: URL has '${validatedSport}' but request has '${validatedBody.sport}'`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (
      validatedBody.division &&
      validatedBody.division !== validatedDivision
    ) {
      return new Response(
        JSON.stringify({
          error: `Division mismatch: URL has '${validatedDivision}' but request has '${validatedBody.division}'`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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
      return new Response(
        JSON.stringify({ error: `Poll not found: ${pollSlug}` }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const assigned = await isUserAssignedToPoll({
      pollId: poll.id,
      userId: user.userId,
    });
    if (!assigned) {
      return new Response(
        JSON.stringify({
          error: "You are not assigned as a voter for this poll",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const seasonInfo = await getSeasonInfo(validatedSport);
    const { year, currentWeek: votingWeek } = seasonInfo;

    if (
      !seasonInfo.isPreseason &&
      !seasonInfo.isRegularSeason &&
      !seasonInfo.isPostseason
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Voting is only allowed during preseason, regular season, or postseason",
          currentPeriod: "off-season",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const weekId = await resolveWeekIdForLegacyWeek({
      sportId,
      year,
      legacyWeek: votingWeek,
    });
    if (!weekId) {
      return new Response(
        JSON.stringify({
          error: `Unable to resolve week for year=${year} week=${votingWeek}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const sanityEntries = processBallotSanityIds(validatedBody);
    if (sanityEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one team must be ranked" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const alreadyVoted = await hasVoterVoted({
      year,
      week: votingWeek,
      division: pollSlug,
      sportId,
      userId: user.userId,
    });
    if (alreadyVoted) {
      return new Response(
        JSON.stringify({ error: "You have already voted for this week" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    const schoolBySanityId = await getSchoolIdsBySanityIds(
      sanityEntries.map((e) => e.sanityId),
    );

    const entries = [];
    for (const entry of sanityEntries) {
      const schoolId = schoolBySanityId.get(entry.sanityId);
      if (!schoolId) {
        return new Response(
          JSON.stringify({
            error: `Unknown school id on ballot: ${entry.sanityId}`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      entries.push({
        schoolId,
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(
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

    const sportId = await getSportIdBySlug(validatedSport);
    if (!sportId) {
      throw new Error(`Sport not found: ${validatedSport}`);
    }

    const poll = await getPollBySportAndSlug({
      sportId,
      slug: validatedDivision,
    });
    if (!poll) {
      return new Response(
        JSON.stringify({ error: `Poll not found: ${validatedDivision}` }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const assigned = await isUserAssignedToPoll({
      pollId: poll.id,
      userId: user.userId,
    });
    if (!assigned) {
      return new Response(
        JSON.stringify({
          error: "You are not assigned as a voter for this poll",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
