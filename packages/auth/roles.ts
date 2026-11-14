/**
 * Staff roles: what someone can do in the admin app. They live in a Clerk
 * user's public metadata as `roles`, which only our backend can write, and
 * reach the server in the session token. Voting is separate: `isVoter` plus a
 * poll assignment, checked by the web app.
 *
 *   { "isVoter": true, "roles": ["portal", "ballots"] }
 *
 * `isAdmin: true` still means admin, so existing admins keep access while
 * roles move over.
 */
export const STAFF_ROLES = ["admin", "portal", "ballots"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_INFO: Record<
  StaffRole,
  { label: string; description: string }
> = {
  admin: {
    label: "Admin",
    description: "Everything, including publishing polls and managing staff.",
  },
  portal: {
    label: "Transfer portal",
    description:
      "Add and edit players, record moves and offers, merge duplicates, and push to the site.",
  },
  ballots: {
    label: "Ballot viewer",
    description:
      "Read every poll's ballots, before and after publishing. Can't change anything.",
  },
};

export function isStaffRole(value: unknown): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

/**
 * The staff roles in a user's public metadata (or the session claim that
 * copies it). Unknown values are dropped, so a typo grants nothing.
 */
export function staffRoles(metadata: unknown): StaffRole[] {
  if (!metadata || typeof metadata !== "object") return [];
  const { roles, isAdmin } = metadata as { roles?: unknown; isAdmin?: unknown };
  const listed = Array.isArray(roles) ? roles.filter(isStaffRole) : [];
  const all = isAdmin === true ? ["admin" as const, ...listed] : listed;
  return STAFF_ROLES.filter((role) => all.includes(role));
}
