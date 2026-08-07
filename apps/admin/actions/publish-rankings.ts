"use server";

import { clerkClient } from "@redshirt-sports/auth/server";
import {
  getPollRankingPublishPreview,
  listLegacyWeeksForSportYear,
  listPolls,
  listSeasonYearsForSport,
  parseCalendarWeekKey,
  publishPollRankingsForWeek,
  reassignBallotWeek,
  resolveWeekIdForCalendarWeek,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { buildNudgeMessage } from "@/lib/nudge";
import { requireAdmin } from "@/lib/require-admin";

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
  revalidatePath("/rankings");
  revalidatePath("/");
  return result;
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

  const result = await reassignBallotWeek({
    pollId,
    userId,
    fromWeekId,
    toWeekId,
  });

  revalidatePath("/rankings");
  return result;
}
