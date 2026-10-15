export type AppRole = "admin" | "voter";

export type RoleMetadata = {
  isAdmin?: boolean;
  isVoter?: boolean;
};

/**
 * Staff and voter checks use the boolean flags already stored on Clerk users.
 * The five blueprint role strings are not in production metadata yet.
 */
export function hasRole(
  metadata: RoleMetadata | null | undefined,
  role: AppRole,
) {
  if (role === "admin") return Boolean(metadata?.isAdmin);
  return Boolean(metadata?.isVoter);
}
