import { auth } from "@redshirt-sports/auth/server";
import { forbidden } from "next/navigation";
import { cache } from "react";

import { PUBLIC_SITE_URL } from "@/lib/site";

type UserMetadata = {
  isVoter?: boolean;
  isAdmin?: boolean;
};

export { PUBLIC_SITE_URL };

/**
 * Require a signed-in admin. Use in Server Components, layouts, and Server Actions.
 * Unauthenticated users are redirected to sign-in (401 for Server Actions).
 * Authenticated non-admins get the staff-only 403 page.
 *
 * Cached per request so layout + page data loaders share one `auth.protect`.
 */
export const requireAdmin = cache(async () => {
  const { sessionClaims } = await auth.protect();
  const { isAdmin } = (sessionClaims?.metadata ?? {}) as UserMetadata;

  if (!isAdmin) {
    forbidden();
  }
});
