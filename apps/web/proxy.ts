import { authMiddleware } from "@redshirt-sports/auth/proxy";
import { type NextRequest, NextResponse } from "next/server";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@redshirt-sports/security/proxy";

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets and Posthog ingest
  matcher: [
    "/((?!_next/static|_next/image|ingest|favicon.ico|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

const securityHeaders = securityMiddleware(noseconeOptions);

export default authMiddleware(async (_auth, request, event) => {
  const headersResponse = securityHeaders();

  return headersResponse;
});

// type UserMetadata = {
//   isVoter?: boolean;
//   isAdmin?: boolean;
// };

// const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
// const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/vote(.*)"]);

// export default clerkMiddleware(async (auth, req: NextRequest) => {
//   const { userId, sessionClaims, redirectToSignIn } = await auth();
//   if (isProtectedRoute(req)) {
//     await auth.protect();
//     const { isVoter, isAdmin } = sessionClaims?.metadata as UserMetadata;

//     if (!isAdmin && req.nextUrl.pathname.startsWith("/admin")) {
//       return NextResponse.error();
//     }

//     if (!isVoter) {
//       return NextResponse.redirect(new URL("/", req.url));
//     }
//   }

//   if (userId && isOnboardingRoute(req)) {
//     return NextResponse.next();
//   }

//   if (!userId && isProtectedRoute(req)) {
//     return redirectToSignIn({ returnBackUrl: req.url });
//   }

//   if (userId && !sessionClaims?.metadata?.onboardingComplete) {
//     const onboardingUrl = new URL("/onboarding", req.url);
//     onboardingUrl.searchParams.set("redirect_url", req.url);
//     return NextResponse.redirect(onboardingUrl);
//   }

//   if (userId && isProtectedRoute(req)) {
//     return NextResponse.next();
//   }
// });

// export const config = {
//   matcher: [
//     "/admin/:path*",
//     "/vote/:path*",
//     "/onboarding/:path*",
//     "/api/vote/:path*",
//   ],
// };
