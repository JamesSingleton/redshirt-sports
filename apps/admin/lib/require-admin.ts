import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PUBLIC_SITE_URL } from "@/lib/site";

type UserMetadata = {
  isVoter?: boolean;
  isAdmin?: boolean;
};

export { PUBLIC_SITE_URL };

/**
 * Require a signed-in admin. Use in Server Components, layouts, and Server Actions.
 * Unauthenticated users are redirected to sign-in (401 for Server Actions).
 * Authenticated non-admins are sent to the public site.
 */
export async function requireAdmin() {
  const { sessionClaims } = await auth.protect();
  const { isAdmin } = (sessionClaims?.metadata ?? {}) as UserMetadata;

  if (!isAdmin) {
    redirect(PUBLIC_SITE_URL);
  }
}
