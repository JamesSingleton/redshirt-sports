import {
  isAdminMetadata,
  type StaffRole,
  staffRoles,
} from "@redshirt-sports/auth/roles";
import { auth } from "@redshirt-sports/auth/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { PUBLIC_SITE_URL } from "@/lib/site";
import { timedStep } from "@/lib/slow-steps";

/**
 * Parts of the admin app. Every page and Server Action belongs to one and
 * checks it with `requireArea`. Admins (`isAdmin`) get all of them; staff
 * roles get only their own.
 */
export const AREAS = ["admin", "portal", "ballots"] as const;
export type Area = (typeof AREAS)[number];

const ROLE_AREAS: Record<StaffRole, readonly Area[]> = {
  portal: ["portal"],
  ballots: ["ballots"],
};

export function areasFor(
  isAdmin: boolean,
  roles: readonly StaffRole[],
): Set<Area> {
  return new Set(isAdmin ? AREAS : roles.flatMap((role) => ROLE_AREAS[role]));
}

export interface Access {
  userId: string;
  isAdmin: boolean;
  roles: StaffRole[];
  areas: Set<Area>;
}

/**
 * The signed-in user's admin flag, roles, and areas, from the session token's `metadata`
 * claim (Clerk copies public metadata into it). Cached per request, so the
 * layout, page, and data loaders share one `auth.protect`.
 */
export const getAccess = cache(async (): Promise<Access> => {
  const { userId, sessionClaims } = await timedStep("auth: protect", () =>
    auth.protect(),
  );
  const metadata = sessionClaims?.metadata;
  const isAdmin = isAdminMetadata(metadata);
  const roles = staffRoles(metadata);
  return { userId, isAdmin, roles, areas: areasFor(isAdmin, roles) };
});

/**
 * Anyone with a staff role. Signed-out users go to sign-in (401 for Server
 * Actions); signed-in users with no role go to the public site.
 */
export async function requireStaff(): Promise<Access> {
  const access = await getAccess();
  if (access.areas.size === 0) redirect(PUBLIC_SITE_URL);
  return access;
}

/**
 * Staff who can use this part of the admin. Anyone else gets a 404, which
 * doesn't confirm the page exists. Server Actions check this themselves:
 * hiding a nav link is never the only protection.
 */
export async function requireArea(area: Area): Promise<Access> {
  const access = await requireStaff();
  if (!access.areas.has(area)) notFound();
  return access;
}
