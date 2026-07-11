import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk middleware — auth gating lives on resources (layouts/pages/route handlers),
 * not createRouteMatcher (deprecated). Keep only cross-cutting UX redirects here.
 *
 * @see https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  // Allow the onboarding flow itself without bouncing in a loop.
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return NextResponse.next();
  }

  // Cross-cutting onboarding redirect (resource pages still call auth.protect()).
  if (userId && !sessionClaims?.metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    onboardingUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk frontend API proxy path
    "/__clerk/(.*)",
  ],
};
