"use server";

import {
  getPollRankingPublishPreview,
  listLegacyWeeksForSportYear,
  listPolls,
  listSeasonYearsForSport,
  type SportParam,
} from "@redshirt-sports/db/queries";

import { requireArea } from "@/lib/access";

// Read-only views of ballots for ballot viewers (and admins). Nothing here
// writes: publishing, nudges, and moving ballots stay on the admin's desk.

const SPORT_PARAMS = new Set<string>([
  "football",
  "mens-basketball",
  "womens-basketball",
]);

export async function getBallotPolls() {
  await requireArea("ballots");
  const polls = await listPolls();
  return polls
    .filter((poll) => poll.isActive)
    .map((poll) => ({
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      sportId: poll.sportId,
      sportSlug: poll.sport?.slug ?? "",
    }));
}

export async function getBallotYears(sportId: string) {
  await requireArea("ballots");
  if (!sportId) throw new Error("sportId is required");
  return listSeasonYearsForSport(sportId);
}

export async function getBallotWeeks(input: { sportId: string; year: number }) {
  await requireArea("ballots");
  if (!input.sportId || !input.year) {
    throw new Error("sportId and year are required");
  }
  const weeks = await listLegacyWeeksForSportYear(input);
  return weeks.map((week) => ({ weekKey: week.weekKey, label: week.label }));
}

/**
 * One week of one poll: every voter's ballot as it stands now (submitted or
 * not), who hasn't voted yet, and the running consensus, so a viewer can
 * spot a team someone left off.
 */
export async function getBallotWeek(input: {
  sportSlug: string;
  division: string;
  year: number;
  weekKey: string;
}) {
  await requireArea("ballots");
  if (!SPORT_PARAMS.has(input.sportSlug)) {
    throw new Error(`Unsupported sport: ${input.sportSlug}`);
  }
  if (!input.weekKey) throw new Error("weekKey is required");
  const preview = await getPollRankingPublishPreview({
    ...input,
    sport: input.sportSlug as SportParam,
  });
  return {
    pollName: preview.poll.name,
    published: preview.alreadyPublished,
    ballotCount: preview.ballotCount,
    assignedCount: preview.assignedCount,
    ballots: preview.panel
      .filter((voter) => voter.submitted)
      .map((voter) => ({
        userId: voter.userId,
        name: `${voter.firstName} ${voter.lastName}`.trim(),
        organization: voter.organization,
        submittedAt: voter.submittedAt,
        entries: voter.ballotEntries.map((entry) => ({
          rank: entry.rank,
          schoolId: entry.schoolId,
          name: entry.shortName ?? entry.name,
        })),
      })),
    missing: preview.missing.map((voter) => ({
      userId: voter.userId,
      name: `${voter.firstName} ${voter.lastName}`.trim(),
      organization: voter.organization,
    })),
    consensus: preview.rankings.slice(0, 25).map((row) => ({
      schoolId: row.schoolId,
      name: row.shortName ?? row.name,
    })),
  };
}

export type BallotWeek = Awaited<ReturnType<typeof getBallotWeek>>;
