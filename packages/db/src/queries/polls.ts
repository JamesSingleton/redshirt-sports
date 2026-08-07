import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  pollsTable,
  pollVotersTable,
  sportsTable,
  usersTable,
} from "../schema";
import type { SportParam } from "./sports";
import { getSportIdBySlug } from "./sports";

export async function getPollBySportAndSlug({
  sportId,
  slug,
}: {
  sportId: string;
  slug: string;
}) {
  return db.query.pollsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.sportId, sportId), eq(model.slug, slug)),
  });
}

export async function getPollBySportSlugAndPollSlug({
  sportSlug,
  pollSlug,
}: {
  sportSlug: SportParam;
  pollSlug: string;
}) {
  const sportId = await getSportIdBySlug(sportSlug);
  if (!sportId) return null;
  return getPollBySportAndSlug({ sportId, slug: pollSlug });
}

export async function listPolls(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? true;
  return db.query.pollsTable.findMany({
    where: activeOnly ? (model, { eq }) => eq(model.isActive, true) : undefined,
    with: {
      sport: true,
    },
    orderBy: (model, { asc, desc }) =>
      activeOnly ? [asc(model.name)] : [desc(model.isActive), asc(model.name)],
  });
}

export async function listSports() {
  return db
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
      displayName: sportsTable.displayName,
      isActive: sportsTable.isActive,
    })
    .from(sportsTable)
    .orderBy(asc(sportsTable.name));
}

export async function createPoll({
  sportId,
  slug,
  name,
  isActive = true,
  divisionSportId,
}: {
  sportId: string;
  slug: string;
  name: string;
  isActive?: boolean;
  divisionSportId?: string | null;
}) {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!sportId || !normalizedSlug || !name.trim()) {
    throw new Error("sportId, slug, and name are required");
  }

  const [created] = await db
    .insert(pollsTable)
    .values({
      sportId,
      slug: normalizedSlug,
      name: name.trim(),
      isActive,
      divisionSportId: divisionSportId || null,
    })
    .returning();

  return created!;
}

export async function updatePoll({
  id,
  slug,
  name,
  isActive,
  divisionSportId,
}: {
  id: string;
  slug?: string;
  name?: string;
  isActive?: boolean;
  divisionSportId?: string | null;
}) {
  if (!id) throw new Error("id is required");

  const patch: Partial<typeof pollsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (slug != null) patch.slug = slug.trim().toLowerCase();
  if (name != null) patch.name = name.trim();
  if (isActive != null) patch.isActive = isActive;
  if (divisionSportId !== undefined) {
    patch.divisionSportId = divisionSportId || null;
  }

  const [updated] = await db
    .update(pollsTable)
    .set(patch)
    .where(eq(pollsTable.id, id))
    .returning();

  if (!updated) throw new Error("Poll not found");
  return updated;
}

/**
 * Active poll assignments for credentialed voters only.
 * Former voters (isVoter=false) are excluded even if poll_voters.revoked_at is null.
 */
export async function listActivePollVoters(pollId: string) {
  return db
    .select({
      id: pollVotersTable.id,
      pollId: pollVotersTable.pollId,
      userId: pollVotersTable.userId,
      revokedAt: pollVotersTable.revokedAt,
      createdAt: pollVotersTable.createdAt,
      updatedAt: pollVotersTable.updatedAt,
      user: {
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        organization: usersTable.organization,
        organizationRole: usersTable.organizationRole,
        isAdmin: usersTable.isAdmin,
        isVoter: usersTable.isVoter,
      },
    })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        eq(pollVotersTable.pollId, pollId),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, true),
      ),
    );
}

/**
 * Active credentialed voter user ids keyed by poll id.
 */
export async function listActivePollVoterUserIdsByPollIds(pollIds: string[]) {
  const byPollId = new Map<string, string[]>();
  if (pollIds.length === 0) return byPollId;

  for (const pollId of pollIds) {
    byPollId.set(pollId, []);
  }

  const rows = await db
    .select({
      pollId: pollVotersTable.pollId,
      userId: pollVotersTable.userId,
    })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        inArray(pollVotersTable.pollId, pollIds),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, true),
      ),
    );

  for (const row of rows) {
    byPollId.get(row.pollId)?.push(row.userId);
  }

  return byPollId;
}

/**
 * Soft-revoke poll assignments for users who are no longer credentialed voters.
 * Historical ballots are untouched.
 */
export async function revokeAssignmentsForNonVoters(userId?: string) {
  const now = new Date();
  await db
    .update(pollVotersTable)
    .set({ revokedAt: now, updatedAt: now })
    .from(usersTable)
    .where(
      and(
        eq(pollVotersTable.userId, usersTable.id),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, false),
        ...(userId ? [eq(pollVotersTable.userId, userId)] : []),
      ),
    );
}

export async function isUserAssignedToPoll({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  const [row] = await db
    .select({ id: pollVotersTable.id })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        eq(pollVotersTable.pollId, pollId),
        eq(pollVotersTable.userId, userId),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, true),
      ),
    )
    .limit(1);

  return !!row;
}

export async function assignVoterToPoll({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  const user = await db.query.usersTable.findFirst({
    where: (model, { eq }) => eq(model.id, userId),
    columns: { id: true, isVoter: true },
  });
  if (!user?.isVoter) {
    throw new Error("User is not a credentialed voter");
  }

  const existing = await db.query.pollVotersTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.pollId, pollId), eq(model.userId, userId)),
  });

  if (existing) {
    if (existing.revokedAt) {
      await db
        .update(pollVotersTable)
        .set({ revokedAt: null, updatedAt: new Date() })
        .where(eq(pollVotersTable.id, existing.id));
    }
    return existing.id;
  }

  const [row] = await db
    .insert(pollVotersTable)
    .values({ pollId, userId })
    .returning({ id: pollVotersTable.id });
  return row?.id;
}

export async function revokeVoterFromPoll({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  await db
    .update(pollVotersTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(pollVotersTable.pollId, pollId),
        eq(pollVotersTable.userId, userId),
        isNull(pollVotersTable.revokedAt),
      ),
    );
}

export async function listVoters() {
  return db.query.usersTable.findMany({
    where: (model, { eq }) => eq(model.isVoter, true),
    orderBy: (model, { asc }) => [asc(model.lastName), asc(model.firstName)],
  });
}

export async function countVoters() {
  const [row] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.isVoter, true));
  return row?.count ?? 0;
}

export async function listUsers() {
  return db.query.usersTable.findMany({
    orderBy: (model, { asc }) => [asc(model.lastName), asc(model.firstName)],
  });
}

export async function countUsers() {
  const [row] = await db.select({ count: count() }).from(usersTable);
  return row?.count ?? 0;
}

/**
 * Active credentialed voter counts keyed by poll id.
 * Former voters (isVoter=false) are excluded even if poll_voters.revoked_at is null.
 */
export async function countActivePollVotersByPollIds(pollIds: string[]) {
  const counts = new Map<string, number>();
  if (pollIds.length === 0) return counts;

  for (const pollId of pollIds) {
    counts.set(pollId, 0);
  }

  const rows = await db
    .select({
      pollId: pollVotersTable.pollId,
      count: count(),
    })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        inArray(pollVotersTable.pollId, pollIds),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, true),
      ),
    )
    .groupBy(pollVotersTable.pollId);

  for (const row of rows) {
    counts.set(row.pollId, row.count);
  }

  return counts;
}

/**
 * Update local voter credential flag. When clearing credentials, soft-revoke
 * all active poll assignments (ballots are kept).
 */
export async function setUserIsVoter({
  userId,
  isVoter,
}: {
  userId: string;
  isVoter: boolean;
}) {
  await db.update(usersTable).set({ isVoter }).where(eq(usersTable.id, userId));

  if (!isVoter) {
    await revokeAssignmentsForNonVoters(userId);
  }
}

export async function getPollsForUser(userId: string) {
  return db
    .select({
      pollId: pollsTable.id,
      slug: pollsTable.slug,
      name: pollsTable.name,
      sportId: pollsTable.sportId,
    })
    .from(pollVotersTable)
    .innerJoin(pollsTable, eq(pollVotersTable.pollId, pollsTable.id))
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        eq(pollVotersTable.userId, userId),
        isNull(pollVotersTable.revokedAt),
        eq(pollsTable.isActive, true),
        eq(usersTable.isVoter, true),
      ),
    );
}

/** Used by tests / ops to count stale assignments. */
export async function countStalePollVoterAssignments() {
  const [row] = await db
    .select({ count: count() })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(isNull(pollVotersTable.revokedAt), eq(usersTable.isVoter, false)),
    );
  return row?.count ?? 0;
}
