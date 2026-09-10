"use server";

import { clerkClient } from "@redshirt-sports/auth/server";
import { getSeasonInfo } from "@redshirt-sports/clients/espn";
import {
  getPollRankingPublishPreview,
  listLegacyWeeksForSportYear,
  listPolls,
  listSeasonYearsForSport,
  PollWeekLockedError,
  publishPollRankingsForWeek,
  reassignBallotWeek,
  resolveWeekIdForCalendarWeek,
  type SportParam,
  unpublishPollRankingsForWeek,
} from "@redshirt-sports/db/queries";
import {
  parseCalendarWeekKey,
  seasonTypeAndNumberToLegacyWeek,
} from "@redshirt-sports/db/utils/week-mapping";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { buildNudgeMessage } from "@/lib/nudge";
import { requireAdmin } from "@/lib/require-admin";
import { revalidateWebRankingsCache } from "@/lib/revalidate-web-rankings";

const SPORT_PARAMS = new Set<SportParam>([
  "football",
  "mens-basketball",
  "womens-basketball",
]);

function asSportParam(slug: string): SportParam {
  if (!SPORT_PARAMS.has(slug as SportParam)) {
    throw new Error(`Unsupported sport: ${slug}`);
  }
  return slug as SportParam;
}

export async function getPublishRankingsBootstrap() {
  await requireAdmin();
  const polls = await listPolls();
  return {
    polls: polls.map((poll) => ({
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      sportId: poll.sportId,
      sportSlug: poll.sport?.slug ?? "",
      sportName: poll.sport?.name ?? poll.sport?.slug ?? "",
    })),
  };
}

export async function getYearsForPollSport(sportId: string) {
  await requireAdmin();
  if (!sportId) throw new Error("sportId is required");
  return listSeasonYearsForSport(sportId);
}

export async function getWeeksForPollSportYear({
  sportId,
  year,
}: {
  sportId: string;
  year: number;
}) {
  await requireAdmin();
  if (!sportId || !year) throw new Error("sportId and year are required");
  return listLegacyWeeksForSportYear({ sportId, year });
}

export async function previewRankingsPublish({
  sportSlug,
  division,
  year,
  weekKey,
}: {
  sportSlug: string;
  division: string;
  year: number;
  weekKey: string;
}) {
  await requireAdmin();
  if (!weekKey) throw new Error("weekKey is required");
  return getPollRankingPublishPreview({
    sport: asSportParam(sportSlug),
    division,
    year,
    weekKey,
  });
}

export async function publishRankings({
  sportSlug,
  division,
  year,
  weekKey,
}: {
  sportSlug: string;
  division: string;
  year: number;
  weekKey: string;
}) {
  await requireAdmin();
  if (!weekKey) throw new Error("weekKey is required");
  const result = await publishPollRankingsForWeek({
    sport: asSportParam(sportSlug),
    division,
    year,
    weekKey,
  });
  after(async () => {
    revalidatePath("/rankings");
    revalidatePath("/");
    await revalidateWebRankingsCache({
      sport: sportSlug,
      division,
      year,
      weekKey,
    });
  });
  return result;
}

export async function unpublishRankings({
  sportSlug,
  division,
  year,
  weekKey,
}: {
  sportSlug: string;
  division: string;
  year: number;
  weekKey: string;
}) {
  await requireAdmin();
  if (!weekKey) throw new Error("weekKey is required");
  const sport = asSportParam(sportSlug);
  const result = await unpublishPollRankingsForWeek({
    sport,
    division,
    year,
    weekKey,
  });
  after(async () => {
    revalidatePath("/rankings");
    revalidatePath("/");
    await revalidateWebRankingsCache({
      sport: sportSlug,
      division,
      year,
      weekKey,
    });
  });

  const parsed = parseCalendarWeekKey(weekKey);
  const seasonInfo = await getSeasonInfo(sport);
  const unpublishedLegacy = parsed
    ? seasonTypeAndNumberToLegacyWeek(parsed.seasonType, parsed.weekNumber)
    : null;
  const votersCanEdit =
    unpublishedLegacy != null &&
    year === seasonInfo.year &&
    unpublishedLegacy === seasonInfo.votingWeek;

  return { ...result, votersCanEdit };
}

export async function getVoterNudgeMailto({
  userId,
  firstName,
  pollName,
  sportSlug,
  division,
}: {
  userId: string;
  firstName: string;
  pollName: string;
  sportSlug: string;
  division: string;
}) {
  await requireAdmin();
  if (!userId) throw new Error("userId is required");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("No email address on this Clerk user");
  }

  const body = buildNudgeMessage({
    firstName,
    pollName,
    sportSlug,
    division,
  });
  const subject = `${pollName} ballot reminder`;
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { email, mailto, body };
}

export async function reassignVoterBallotWeek({
  pollId,
  sportId,
  year,
  userId,
  fromWeekKey,
  toWeekKey,
}: {
  pollId: string;
  sportId: string;
  year: number;
  userId: string;
  fromWeekKey: string;
  toWeekKey: string;
}) {
  await requireAdmin();
  if (!pollId || !sportId || !year || !userId || !fromWeekKey || !toWeekKey) {
    throw new Error(
      "pollId, sportId, year, userId, fromWeekKey, and toWeekKey are required",
    );
  }

  const fromParsed = parseCalendarWeekKey(fromWeekKey);
  const toParsed = parseCalendarWeekKey(toWeekKey);
  if (!fromParsed || !toParsed) {
    throw new Error("Invalid week key");
  }

  const [fromWeekId, toWeekId] = await Promise.all([
    resolveWeekIdForCalendarWeek({
      sportId,
      year,
      seasonType: fromParsed.seasonType,
      weekNumber: fromParsed.weekNumber,
    }),
    resolveWeekIdForCalendarWeek({
      sportId,
      year,
      seasonType: toParsed.seasonType,
      weekNumber: toParsed.weekNumber,
    }),
  ]);

  if (!fromWeekId) {
    throw new Error(`Source week not found: ${fromWeekKey}`);
  }
  if (!toWeekId) {
    throw new Error(`Target week not found: ${toWeekKey}`);
  }

  try {
    const result = await reassignBallotWeek({
      pollId,
      userId,
      fromWeekId,
      toWeekId,
    });

    revalidatePath("/rankings");
    return result;
  } catch (error) {
    if (error instanceof PollWeekLockedError) {
      throw new Error(
        "Cannot reassign ballots to or from a week with published rankings. Unpublish first.",
      );
    }
    throw error;
  }
}
