import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type UserMetadata = {
  isVoter?: boolean;
  isAdmin?: boolean;
};

/**
 * Require an authenticated admin session.
 * Uses resource-level checks (auth.protect + metadata) — not Middleware path matchers.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId, sessionClaims } = await auth.protect();

  const metadata = sessionClaims?.metadata as UserMetadata | undefined;
  if (!metadata?.isAdmin) {
    redirect("https://www.redshirtsports.xyz");
  }

  return { userId };
}
