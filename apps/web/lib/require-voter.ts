import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type UserMetadata = {
  isVoter?: boolean;
  isAdmin?: boolean;
  onboardingComplete?: boolean;
};

/**
 * Resource-level gate for vote pages/layouts.
 * Prefer this over Middleware path matching (createRouteMatcher is deprecated).
 */
export async function requireVoter(): Promise<{ userId: string }> {
  const { userId, sessionClaims } = await auth.protect();

  const metadata = sessionClaims?.metadata as UserMetadata | undefined;
  if (!metadata?.isVoter) {
    redirect("/");
  }

  return { userId };
}
