import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware only — admin authorization is enforced in the dashboard layout
 * and server actions via requireAdmin() (createRouteMatcher is deprecated).
 *
 * @see https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
