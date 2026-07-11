"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { primaryDb as db } from "@redshirt-sports/db/client";
import {
  listVotersWithAssignments,
  setVoterPollAssignments,
  type VoterPollAssignmentInput,
} from "@redshirt-sports/db/queries";
import { usersTable } from "@redshirt-sports/db/schema";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/require-admin";

export async function listVotersAction() {
  await requireAdmin();
  return listVotersWithAssignments();
}

export async function setAssignmentsAction(
  userId: string,
  assignments: VoterPollAssignmentInput[],
) {
  await requireAdmin();
  return setVoterPollAssignments(userId, assignments);
}

export async function listSportsAction() {
  await requireAdmin();
  const sports = await db.query.sportsTable.findMany();
  return [...sports]
    .map((sport) => ({
      id: sport.id,
      slug: sport.slug,
      name: sport.name,
      displayName: sport.displayName,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function setUserFlagsAction(
  userId: string,
  flags: { isVoter?: boolean; isAdmin?: boolean },
) {
  await requireAdmin();

  const updates: { isVoter?: boolean; isAdmin?: boolean } = {};
  if (typeof flags.isVoter === "boolean") {
    updates.isVoter = flags.isVoter;
  }
  if (typeof flags.isAdmin === "boolean") {
    updates.isAdmin = flags.isAdmin;
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      ...updates,
    },
  });

  return { success: true };
}
