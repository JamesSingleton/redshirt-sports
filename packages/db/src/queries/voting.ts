import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  ballotEntriesTable,
  ballotsTable,
  pollRankingsTable,
  pollsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  weeksTable,
} from "../schema";
import { getPollBySportAndSlug } from "./polls";
import type { SportParam } from "./sports";
import { getSportIdBySlug } from "./sports";
import {
  resolveWeekIdForLegacyWeek,
  seasonTypeAndNumberToLegacyWeek,
} from "./weeks";

interface GetUsersVote {
  year: number;
  week: number;
  division: string;
  sportId: string;
  userId: string;
}

async function resolvePollAndWeek({
  sportId,
  division,
  year,
  week,
}: {
  sportId: string;
  division: string;
  year: number;
  week: number;
}) {
  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) return null;
  const weekId = await resolveWeekIdForLegacyWeek({
    sportId,
    year,
    legacyWeek: week,
  });
  if (!weekId) return null;
  return { poll, weekId };
}

export async function hasVoterVoted({
  year,
  week,
  division,
  sportId,
  userId,
}: GetUsersVote) {
  const resolved = await resolvePollAndWeek({
    sportId,
    division,
    year,
    week,
  });
  if (!resolved) return false;

  const ballot = await db.query.ballotsTable.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.pollId, resolved.poll.id),
        eq(model.userId, userId),
        eq(model.weekId, resolved.weekId),
      ),
  });
  return !!ballot;
}

export async function countBallotsForPollWeek({
  pollId,
  weekId,
}: {
  pollId: string;
  weekId: string;
}) {
  const [row] = await db
    .select({ count: count() })
    .from(ballotsTable)
    .where(
      and(eq(ballotsTable.pollId, pollId), eq(ballotsTable.weekId, weekId)),
    );
  return row?.count ?? 0;
}

function pollWeekKey(pollId: string, weekId: string) {
  return `${pollId}:${weekId}`;
}

/**
 * Ballot counts for many poll/week pairs in one query.
 * Returns a map keyed by `${pollId}:${weekId}`.
 */
export async function countBallotsForPollWeeks(
  pairs: Array<{ pollId: string; weekId: string }>,
) {
  const counts = new Map<string, number>();
  if (pairs.length === 0) return counts;

  for (const pair of pairs) {
    counts.set(pollWeekKey(pair.pollId, pair.weekId), 0);
  }

  const pollIds = [...new Set(pairs.map((pair) => pair.pollId))];
  const weekIds = [...new Set(pairs.map((pair) => pair.weekId))];
  const wanted = new Set(counts.keys());

  const rows = await db
    .select({
      pollId: ballotsTable.pollId,
      weekId: ballotsTable.weekId,
      count: count(),
    })
    .from(ballotsTable)
    .where(
      and(
        inArray(ballotsTable.pollId, pollIds),
        inArray(ballotsTable.weekId, weekIds),
      ),
    )
    .groupBy(ballotsTable.pollId, ballotsTable.weekId);

  for (const row of rows) {
    const key = pollWeekKey(row.pollId, row.weekId);
    if (wanted.has(key)) {
      counts.set(key, row.count);
    }
  }

  return counts;
}

export async function getVoterBallots({
  year,
  week,
  division,
  sportId,
  userId,
}: GetUsersVote) {
  const resolved = await resolvePollAndWeek({
    sportId,
    division,
    year,
    week,
  });
  if (!resolved) return [];

  const ballot = await db.query.ballotsTable.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.pollId, resolved.poll.id),
        eq(model.userId, userId),
        eq(model.weekId, resolved.weekId),
      ),
    with: {
      entries: {
        with: { school: true },
        orderBy: (entry, { asc }) => [asc(entry.rank)],
      },
    },
  });

  if (!ballot) return [];

  // Legacy-shaped rows for existing UI consumers
  return ballot.entries.map((entry) => ({
    id: entry.id,
    userId: ballot.userId,
    division,
    week,
    year,
    createdAt: ballot.submittedAt,
    teamId: entry.school.sanityId ?? entry.schoolId,
    rank: entry.rank,
    points: entry.points,
    sportId,
    schoolId: entry.schoolId,
  }));
}

/** Ballot entries with school display fields for confirmation / share image. */
export type VoterBallotSchoolEntry = {
  rank: number;
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
  image: unknown;
  schoolId: string;
  teamId: string;
};

export async function getVoterBallotSchoolEntries({
  year,
  week,
  division,
  sportId,
  userId,
}: GetUsersVote): Promise<VoterBallotSchoolEntry[]> {
  const resolved = await resolvePollAndWeek({
    sportId,
    division,
    year,
    week,
  });
  if (!resolved) return [];

  const ballot = await db.query.ballotsTable.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.pollId, resolved.poll.id),
        eq(model.userId, userId),
        eq(model.weekId, resolved.weekId),
      ),
    with: {
      entries: {
        with: { school: true },
        orderBy: (entry, { asc }) => [asc(entry.rank)],
      },
    },
  });

  if (!ballot) return [];

  return ballot.entries.map((entry) => ({
    rank: entry.rank,
    name: entry.school.name,
    shortName: entry.school.shortName,
    abbreviation: entry.school.abbreviation,
    image: entry.school.image,
    schoolId: entry.schoolId,
    teamId: entry.school.sanityId ?? entry.schoolId,
  }));
}

export async function getBallotsByWeekYearDivisionAndSport({
  year,
  week,
  division,
  sportId,
}: {
  year: number;
  week: number;
  division: string;
  sportId: string;
}) {
  const resolved = await resolvePollAndWeek({
    sportId,
    division,
    year,
    week,
  });
  if (!resolved) return [];

  const ballots = await db.query.ballotsTable.findMany({
    where: (model, { eq, and }) =>
      and(
        eq(model.pollId, resolved.poll.id),
        eq(model.weekId, resolved.weekId),
      ),
    with: {
      entries: {
        with: { school: true },
      },
    },
  });

  return ballots.flatMap((ballot) =>
    ballot.entries.map((entry) => ({
      id: entry.id,
      userId: ballot.userId,
      division,
      week,
      year,
      createdAt: ballot.submittedAt,
      teamId: entry.school.sanityId ?? entry.schoolId,
      rank: entry.rank,
      points: entry.points,
      sportId,
      schoolId: entry.schoolId,
    })),
  );
}

export async function getBallotVotesForPollWeek({
  pollId,
  weekId,
  sportId,
  division,
  year,
  legacyWeek,
}: {
  pollId: string;
  weekId: string;
  sportId: string;
  division: string;
  year: number;
  legacyWeek: number;
}) {
  const ballots = await db.query.ballotsTable.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.pollId, pollId), eq(model.weekId, weekId)),
    with: {
      entries: {
        with: { school: true },
      },
    },
  });

  return ballots.flatMap((ballot) =>
    ballot.entries.map((entry) => ({
      id: entry.id,
      userId: ballot.userId,
      division,
      week: legacyWeek,
      year,
      createdAt: ballot.submittedAt,
      teamId: entry.school.sanityId ?? entry.schoolId,
      rank: entry.rank,
      points: entry.points,
      sportId,
      schoolId: entry.schoolId,
    })),
  );
}

export async function getVotedWeeks(year: number) {
  const rows = await db
    .select({
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
    })
    .from(ballotsTable)
    .innerJoin(weeksTable, eq(ballotsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(seasonsTable.year, year));

  return rows.map((row) => ({
    week: seasonTypeAndNumberToLegacyWeek(row.seasonType, row.weekNumber),
    year: row.year,
  }));
}

export async function getYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  const rows = await db
    .selectDistinct({ year: seasonsTable.year })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(pollsTable.slug, division))
    .orderBy(desc(seasonsTable.year));

  return rows.map((row) => ({ year: row.year, division }));
}

export async function getWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number;
  division: string;
}) {
  const rows = await db
    .selectDistinct({
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(and(eq(pollsTable.slug, division), eq(seasonsTable.year, year)));

  return rows
    .map((row) => ({
      week: seasonTypeAndNumberToLegacyWeek(row.seasonType, row.weekNumber),
    }))
    .sort((a, b) => a.week - b.week);
}

export async function getVotesForWeekAndYearByVoter({
  year,
  week,
  division,
  sportId,
}: {
  year: number;
  week: number;
  division: string;
  sportId: string;
}) {
  const allVotes = await getBallotsByWeekYearDivisionAndSport({
    year,
    week,
    division,
    sportId,
  });

  if (allVotes.length === 0) {
    return {};
  }

  const uniqueUserIds = Array.from(
    new Set(allVotes.map((vote) => vote.userId)),
  );

  const allUsers = await db.query.usersTable.findMany({
    where: (model, { inArray }) => inArray(model.id, uniqueUserIds),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      organization: true,
      organizationRole: true,
    },
  });

  const userMap = new Map(allUsers.map((user) => [user.id, user]));
  const userBallots: {
    [key: string]: {
      votes: typeof allVotes;
      userData: (typeof allUsers)[number] | undefined;
    };
  } = {};

  for (const vote of allVotes) {
    if (!userBallots[vote.userId]) {
      userBallots[vote.userId] = {
        votes: [],
        userData: userMap.get(vote.userId),
      };
    }
    userBallots[vote.userId]!.votes.push(vote);
  }

  return userBallots;
}

export async function getYearsWithVotes() {
  const rows = await db
    .selectDistinct({
      year: seasonsTable.year,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      division: pollsTable.slug,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id));

  return rows.map((row) => ({
    year: row.year,
    week: seasonTypeAndNumberToLegacyWeek(row.seasonType, row.weekNumber),
    division: row.division,
  }));
}

export async function getLatestVoterBallot(
  userId: string,
  division: string,
  sport: SportParam,
  currentYear: number,
) {
  const sportId = await getSportIdBySlug(sport);
  if (!sportId) return [];

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) return [];

  const latest = await db
    .select({
      ballotId: ballotsTable.id,
      weekId: ballotsTable.weekId,
      submittedAt: ballotsTable.submittedAt,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
    })
    .from(ballotsTable)
    .innerJoin(weeksTable, eq(ballotsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(
      and(
        eq(ballotsTable.userId, userId),
        eq(ballotsTable.pollId, poll.id),
        eq(seasonsTable.year, currentYear),
      ),
    )
    .orderBy(desc(ballotsTable.submittedAt))
    .limit(1);

  const meta = latest[0];
  if (!meta) return [];

  const legacyWeek = seasonTypeAndNumberToLegacyWeek(
    meta.seasonType,
    meta.weekNumber,
  );

  const entries = await db
    .select({
      id: ballotEntriesTable.id,
      rank: ballotEntriesTable.rank,
      points: ballotEntriesTable.points,
      schoolId: ballotEntriesTable.schoolId,
      teamId: schoolsTable.sanityId,
    })
    .from(ballotEntriesTable)
    .innerJoin(schoolsTable, eq(ballotEntriesTable.schoolId, schoolsTable.id))
    .where(eq(ballotEntriesTable.ballotId, meta.ballotId))
    .orderBy(asc(ballotEntriesTable.rank));

  return entries.map((entry) => ({
    id: entry.id,
    userId,
    division,
    week: legacyWeek,
    year: meta.year,
    createdAt: meta.submittedAt,
    teamId: entry.teamId ?? entry.schoolId,
    rank: entry.rank,
    points: entry.points,
    sportId,
    schoolId: entry.schoolId,
  }));
}

export async function submitBallot({
  pollId,
  userId,
  weekId,
  entries,
}: {
  pollId: string;
  userId: string;
  weekId: string;
  entries: Array<{ schoolId: string; rank: number; points: number }>;
}) {
  return db.transaction(async (tx) => {
    const [ballot] = await tx
      .insert(ballotsTable)
      .values({
        pollId,
        userId,
        weekId,
      })
      .returning();

    if (!ballot) throw new Error("Failed to create ballot");

    await tx.insert(ballotEntriesTable).values(
      entries.map((entry) => ({
        ballotId: ballot.id,
        schoolId: entry.schoolId,
        rank: entry.rank,
        points: entry.points,
      })),
    );

    return ballot;
  });
}

/**
 * Move a voter's ballot from one week to another (admin correction).
 * Fails if no ballot exists on fromWeekId or a ballot already exists on toWeekId.
 */
export async function reassignBallotWeek({
  pollId,
  userId,
  fromWeekId,
  toWeekId,
}: {
  pollId: string;
  userId: string;
  fromWeekId: string;
  toWeekId: string;
}) {
  if (fromWeekId === toWeekId) {
    throw new Error("Source and target week are the same");
  }

  return db.transaction(async (tx) => {
    const existingTarget = await tx.query.ballotsTable.findFirst({
      where: (model, { eq, and }) =>
        and(
          eq(model.pollId, pollId),
          eq(model.userId, userId),
          eq(model.weekId, toWeekId),
        ),
      columns: { id: true },
    });
    if (existingTarget) {
      throw new Error(
        "Voter already has a ballot for the target week; resolve the conflict first",
      );
    }

    const [updated] = await tx
      .update(ballotsTable)
      .set({ weekId: toWeekId, updatedAt: new Date() })
      .where(
        and(
          eq(ballotsTable.pollId, pollId),
          eq(ballotsTable.userId, userId),
          eq(ballotsTable.weekId, fromWeekId),
        ),
      )
      .returning({ id: ballotsTable.id, weekId: ballotsTable.weekId });

    if (!updated) {
      throw new Error("No ballot found for this voter on the source week");
    }

    return updated;
  });
}
