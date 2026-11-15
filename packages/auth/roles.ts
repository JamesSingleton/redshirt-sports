/**
 * Who can do what in the admin app, from a Clerk user's public metadata
 * (which only our backend can write, and which the session token carries):
 *
 *   { "isAdmin": false, "isVoter": true, "roles": ["portal", "ballots"] }
 *
 * - `isAdmin`: full access, as it has always been.
 * - `roles`: limited staff roles for helpers who shouldn't see everything.
 * - `isVoter`: voting on the web app. Separate from both.
 */
export const STAFF_ROLES = ["portal", "ballots"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_INFO: Record<
  StaffRole,
  { label: string; description: string }
> = {
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

export const ADMIN_INFO = {
  label: "Admin",
  description: "Everything, including publishing polls and managing staff.",
};

export function isStaffRole(value: unknown): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

function fields(metadata: unknown) {
  return metadata && typeof metadata === "object"
    ? (metadata as { roles?: unknown; isAdmin?: unknown })
    : {};
}

/** Only a real `true` makes someone an admin: a typo'd string doesn't. */
export function isAdminMetadata(metadata: unknown): boolean {
  return fields(metadata).isAdmin === true;
}

/**
 * The staff roles in a user's public metadata (or the session claim that
 * copies it), in a fixed order. Unknown values are dropped, so a typo grants
 * nothing.
 */
export function staffRoles(metadata: unknown): StaffRole[] {
  const { roles } = fields(metadata);
  const listed = Array.isArray(roles) ? roles : [];
  return STAFF_ROLES.filter((role) => listed.includes(role));
}
