import { asc, eq, ilike, or, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { usersTable } from "../schema";

type ClerkUserFields = {
  id: string;
  firstName: string;
  lastName: string;
  organization?: string | null;
  organizationRole?: string | null;
  isAdmin?: boolean;
  isVoter?: boolean;
  /** Limited staff roles from Clerk public metadata; omitted keeps the stored value. */
  roles?: string[];
};

/**
 * Insert a user from Clerk's `user.created` webhook.
 * Idempotent: a retried delivery, or a `user.updated` that arrived first,
 * leaves the existing row alone.
 */
export async function createUser(user: ClerkUserFields) {
  await db.insert(usersTable).values(user).onConflictDoNothing({
    target: usersTable.id,
  });
}

export async function getUserDisplayFields(id: string) {
  const [user] = await db
    .select({
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      organization: usersTable.organization,
      organizationRole: usersTable.organizationRole,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return user;
}

/**
 * Sync a user from Clerk's `user.updated` webhook.
 * Upserts so the update still lands when `user.created` was lost or arrives
 * later. Undefined fields keep their stored value.
 */
export async function updateUser({
  id,
  ...fields
}: ClerkUserFields & { isVoter: boolean }) {
  await db
    .insert(usersTable)
    .values({ id, ...fields })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: fields,
    });
}

/**
 * Clerk `user.deleted`: keep the row (historical ballots reference it) but
 * drop admin and voter credentials.
 */
export async function deactivateUser(id: string) {
  await db
    .update(usersTable)
    .set({ isAdmin: false, isVoter: false, roles: [] })
    .where(eq(usersTable.id, id));
}

const staffColumns = {
  id: usersTable.id,
  firstName: usersTable.firstName,
  lastName: usersTable.lastName,
  organization: usersTable.organization,
  isAdmin: usersTable.isAdmin,
  isVoter: usersTable.isVoter,
  roles: usersTable.roles,
};

/** Admins and everyone with a staff role, by last name. */
export function listStaffUsers() {
  return db
    .select(staffColumns)
    .from(usersTable)
    .where(
      or(
        eq(usersTable.isAdmin, true),
        sql`cardinality(${usersTable.roles}) > 0`,
      ),
    )
    .orderBy(asc(usersTable.lastName), asc(usersTable.firstName));
}

/** Accounts whose first or last name starts with the query, to add as staff. */
export function searchUsersByName(query: string, limit = 10) {
  const term = `${query.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return db
    .select(staffColumns)
    .from(usersTable)
    .where(
      or(ilike(usersTable.firstName, term), ilike(usersTable.lastName, term)),
    )
    .orderBy(asc(usersTable.lastName), asc(usersTable.firstName))
    .limit(limit);
}

/**
 * Store a user's admin flag and staff roles right away, so the Staff page is current before
 * Clerk's webhook arrives (which then writes the same values).
 */
export async function setUserRoles(input: {
  id: string;
  roles: string[];
  isAdmin: boolean;
}) {
  await db
    .update(usersTable)
    .set({ roles: input.roles, isAdmin: input.isAdmin })
    .where(eq(usersTable.id, input.id));
}
