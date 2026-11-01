import { eq } from "drizzle-orm";

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
    .set({ isAdmin: false, isVoter: false })
    .where(eq(usersTable.id, id));
}
