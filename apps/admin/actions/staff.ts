"use server";

import {
  isStaffRole,
  STAFF_ROLES,
  type StaffRole,
  staffRoles,
} from "@redshirt-sports/auth/roles";
import { clerkClient } from "@redshirt-sports/auth/server";
import {
  listStaffUsers,
  searchUsersByName,
  setUserRoles,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { requireArea } from "@/lib/access";

export interface StaffMember {
  id: string;
  name: string;
  organization: string | null;
  isVoter: boolean;
  roles: StaffRole[];
}

function toMember(row: Awaited<ReturnType<typeof listStaffUsers>>[number]) {
  return {
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    organization: row.organization,
    isVoter: row.isVoter,
    roles: staffRoles({ roles: row.roles, isAdmin: row.isAdmin }),
  } satisfies StaffMember;
}

export async function getStaff() {
  const { userId } = await requireArea("admin");
  const rows = await listStaffUsers();
  return { me: userId, staff: rows.map(toMember) };
}

/** Accounts to give a role to, by first or last name. */
export async function findPeople(query: string) {
  await requireArea("admin");
  if (query.trim().length < 2) return [];
  return (await searchUsersByName(query)).map(toMember);
}

/**
 * Set someone's staff roles. Written to Clerk (the source of truth, which
 * the session token reads) and to Postgres right away; Clerk's webhook then
 * writes the same values. `isAdmin` follows the admin role, so the old flag
 * can't keep admin alive after it's unticked.
 */
export async function setStaffRoles(input: {
  userId: string;
  roles: string[];
}) {
  const { userId: me } = await requireArea("admin");
  if (!input.userId) throw new Error("userId is required");
  const roles = STAFF_ROLES.filter((role) =>
    input.roles.filter(isStaffRole).includes(role),
  );
  const isAdmin = roles.includes("admin");
  if (input.userId === me && !isAdmin) {
    throw new Error("You can't remove your own admin role.");
  }
  const client = await clerkClient();
  await client.users.updateUserMetadata(input.userId, {
    publicMetadata: { roles, isAdmin },
  });
  await setUserRoles({ id: input.userId, roles, isAdmin });
  revalidatePath("/staff");
  return roles;
}
