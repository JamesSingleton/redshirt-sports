import { analytics } from "@redshirt-sports/analytics/server";
import { auth } from "@redshirt-sports/auth/server";
import {
  arePollRankingsPublished,
  getPollBySportAndSlug,
  getSchoolsBySanityIds,
  getSportIdBySlug,
  getVoterBallots,
  hasVoterVoted,
  isUserAssignedToPoll,
  PollWeekLockedError,
  requireVotingSeasonInfo,
  resolveWeekIdForLegacyWeek,
  submitBallot,
  updateBallot,
  type VotingSeasonInfo,
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

const RANKINGS_PUBLISHED_MESSAGE =
  "Voting is closed for this week because rankings have been published";

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

/** Expected request failure whose message is safe to return to the client. */
class VoteRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VoteRequestError";
  }
}

function parseRouteParams(sport: string, division: string) {
  try {
    return {
      validatedSport: validateSport(sport),
      validatedDivision: validateDivision(division),
    };
  } catch (error) {
    throw new VoteRequestError((error as Error).message, 400);
  }
}

async function requireSportId(sport: ReturnType<typeof validateSport>) {
  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    throw new VoteRequestError(`Sport not found: ${sport}`, 404);
  }
  return sportId;
}

async function requireSeasonInfo(
  sportId: string,
  sport: ReturnType<typeof validateSport>,
) {
  try {
    return await requireVotingSeasonInfo(sportId, sport);
  } catch (error) {
    Sentry.captureException(error);
    throw new VoteRequestError("Voting is not open for this sport yet", 503);
  }
}

/** Postgres unique_violation, possibly wrapped by Drizzle as `cause`. */
function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { code?: unknown } | undefined;
  return (
    (error as { code?: unknown }).code === "23505" || cause?.code === "23505"
  );
}

type VoteWriteContext = {
  userId: string;
  sport: ReturnType<typeof validateSport>;
  poll: NonNullable<Awaited<ReturnType<typeof getPollBySportAndSlug>>>;
  pollSlug: string;
  sportId: string;
  year: number;
  votingWeek: number;
  weekId: string;
  seasonInfo: VotingSeasonInfo;
  entries: Array<{ schoolId: string; rank: number; points: number }>;
};

async function resolveVoteWrite(
  req: Request,
  params: Promise<{ sport: string; division: string }>,
): Promise<VoteWriteContext | Response> {
  const { sport: sportSlug, division } = await params;
  const { validatedSport, validatedDivision } = parseRouteParams(
    sportSlug,
    division,
  );

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

  if (validatedBody.division && validatedBody.division !== validatedDivision) {
    return jsonError(
      `Division mismatch: URL has '${validatedDivision}' but request has '${validatedBody.division}'`,
      400,
    );
  }

  const sportId = await requireSportId(validatedSport);

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

  const seasonInfo = await requireSeasonInfo(sportId, validatedSport);
  const { year, votingWeek } = seasonInfo;

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

  const published = await arePollRankingsPublished({
    pollId: poll.id,
    weekId,
  });
  if (published) {
    return jsonError(RANKINGS_PUBLISHED_MESSAGE, 403);
  }

  const sanityEntries = processBallotSanityIds(validatedBody);
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

  return {
    userId: user.userId,
    sport: validatedSport,
    poll,
    pollSlug,
    sportId,
    year,
    votingWeek,
    weekId,
    seasonInfo,
    entries,
  };
}

function seasonTypeLabel(seasonInfo: VotingSeasonInfo) {
  if (seasonInfo.isPreseason) return "preseason";
  if (seasonInfo.isPostseason) return "postseason";
  return "regular_season";
}

/**
 * Map known failures to client-safe responses. Anything else is reported to
 * Sentry and returned as a generic 500 so DB/driver messages never leak.
 */
function handleVoteError(error: unknown) {
  if (error instanceof VoteRequestError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof PollWeekLockedError) {
    return jsonError(error.message, 403);
  }

  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Invalid request data",
        details: error.format(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (error instanceof SyntaxError) {
    return jsonError("Request body must be valid JSON", 400);
  }

  // Concurrent duplicate submit lost the race on the ballots unique constraint.
  if (isUniqueViolation(error)) {
    return jsonError("You have already voted for this week", 409);
  }

  Sentry.captureException(error);
  return jsonError("Internal server error", 500);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const resolved = await resolveVoteWrite(req, params);
    if (resolved instanceof Response) return resolved;

    const alreadyVoted = await hasVoterVoted({
      year: resolved.year,
      week: resolved.votingWeek,
      division: resolved.pollSlug,
      sportId: resolved.sportId,
      userId: resolved.userId,
    });
    if (alreadyVoted) {
      return jsonError("You have already voted for this week", 409);
    }

    await submitBallot({
      pollId: resolved.poll.id,
      userId: resolved.userId,
      weekId: resolved.weekId,
      entries: resolved.entries,
    });

    analytics?.capture({
      distinctId: resolved.userId,
      event: "ballot_submitted",
      properties: {
        sport: resolved.sport,
        division: resolved.pollSlug,
        week: resolved.votingWeek,
        year: resolved.year,
        vote_count: resolved.entries.length,
        season_type: seasonTypeLabel(resolved.seasonInfo),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vote submitted successfully",
        sport: resolved.sport,
        division: resolved.pollSlug,
        week: resolved.votingWeek,
        year: resolved.year,
        voteCount: resolved.entries.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return handleVoteError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const resolved = await resolveVoteWrite(req, params);
    if (resolved instanceof Response) return resolved;

    const alreadyVoted = await hasVoterVoted({
      year: resolved.year,
      week: resolved.votingWeek,
      division: resolved.pollSlug,
      sportId: resolved.sportId,
      userId: resolved.userId,
    });
    if (!alreadyVoted) {
      return jsonError("No ballot found for this week", 404);
    }

    await updateBallot({
      pollId: resolved.poll.id,
      userId: resolved.userId,
      weekId: resolved.weekId,
      entries: resolved.entries,
    });

    analytics?.capture({
      distinctId: resolved.userId,
      event: "ballot_updated",
      properties: {
        sport: resolved.sport,
        division: resolved.pollSlug,
        week: resolved.votingWeek,
        year: resolved.year,
        vote_count: resolved.entries.length,
        season_type: seasonTypeLabel(resolved.seasonInfo),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ballot updated successfully",
        sport: resolved.sport,
        division: resolved.pollSlug,
        week: resolved.votingWeek,
        year: resolved.year,
        voteCount: resolved.entries.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return handleVoteError(error);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const { sport: sportSlug, division } = await params;
    const { validatedSport, validatedDivision } = parseRouteParams(
      sportSlug,
      division,
    );

    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sportId = await requireSportId(validatedSport);

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

    const seasonInfo = await requireSeasonInfo(sportId, validatedSport);
    const { year, votingWeek } = seasonInfo;

    const existingVotePromise = getVoterBallots({
      userId: user.userId,
      sportId,
      division: validatedDivision,
      week: votingWeek,
      year,
    });
    const weekId = await resolveWeekIdForLegacyWeek({
      sportId,
      year,
      legacyWeek: votingWeek,
    });
    const publishedPromise = weekId
      ? arePollRankingsPublished({
          pollId: poll.id,
          weekId,
        })
      : Promise.resolve(false);
    const [published, existingVote] = await Promise.all([
      publishedPromise,
      existingVotePromise,
    ]);

    const hasVoted = existingVote.length > 0;

    return new Response(
      JSON.stringify({
        sport: validatedSport,
        division: validatedDivision,
        week: votingWeek,
        year,
        hasVoted,
        canEdit: hasVoted && !published,
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
    if (!(error instanceof VoteRequestError)) {
      console.error("Vote retrieval error:", error);
    }
    return handleVoteError(error);
  }
}
