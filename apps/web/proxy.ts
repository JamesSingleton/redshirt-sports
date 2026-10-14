import { AUTHORIZED_PARTIES } from "@redshirt-sports/auth/authorized-parties";
import { authMiddleware } from "@redshirt-sports/auth/proxy";
import { type NextRequest, NextResponse } from "next/server";

function isOnboardingRoute(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function isProtectedRoute(req: NextRequest) {
  const { pathname } = req.nextUrl;
  return pathname.startsWith("/admin") || pathname.startsWith("/vote");
}

type AuthFn = {
  (): Promise<{
    userId: string | null;
    sessionClaims?: {
      metadata?: { onboardingComplete?: boolean; isVoter?: boolean };
    } | null;
  }>;
  protect: () => Promise<unknown>;
};

/** Inner middleware logic — exported for Vitest without Clerk wrapper. */
export async function handleAuthProxy(auth: AuthFn, req: NextRequest) {
  const { userId, sessionClaims } = await auth();

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Convenience redirect only — vote/API pages still enforce auth + poll access.
  if (userId && isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // Onboarding is for voters only. A signed-in reader is not sent there.
  if (
    userId &&
    sessionClaims?.metadata?.isVoter &&
    !sessionClaims.metadata.onboardingComplete
  ) {
    const onboardingUrl = new URL("/onboarding", req.url);
    onboardingUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(onboardingUrl);
  }
}

export default authMiddleware(handleAuthProxy, {
  authorizedParties: [...AUTHORIZED_PARTIES],
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/vote/:path*",
    "/onboarding/:path*",
    "/api/vote/:path*",
  ],
};
