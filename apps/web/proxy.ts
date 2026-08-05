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

export default authMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Convenience redirect only — vote/API pages still enforce auth + poll access.
  if (userId && isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  if (userId && !sessionClaims?.metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    onboardingUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(onboardingUrl);
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/vote/:path*",
    "/onboarding/:path*",
    "/api/vote/:path*",
  ],
};
