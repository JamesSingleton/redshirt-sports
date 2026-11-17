import { authMiddleware } from "@redshirt-sports/auth/proxy";
import { parsePlayerSlugId, playerPath } from "@redshirt-sports/db/portal";
import { getPublishedPlayerAddress } from "@redshirt-sports/db/queries";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  createPlayerAddressCache,
  type PlayerAddress,
} from "@/lib/player-address-cache";
import { portalIsPublic } from "@/lib/portal-data";

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
    sessionClaims?: { metadata?: { onboardingComplete?: boolean } } | null;
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

  if (userId && !sessionClaims?.metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    onboardingUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(onboardingUrl);
  }
}

const PLAYERS_PREFIX = "/players/";

const playerAddress = createPlayerAddressCache(getPublishedPlayerAddress);

/** The app's own not-found page, with a real 404 status. */
function notFoundResponse(req: NextRequest) {
  return NextResponse.rewrite(new URL("/_not-found", req.url), {
    status: 404,
  });
}

/**
 * `/players/<slug>-<id>`: real status codes before the page streams. An
 * unknown or malformed id is a 404 (malformed ones never reach the
 * database); a stale slug or a merged player is a 301 to the one
 * address. The page keeps its own checks as a fallback, so if the lookup
 * fails the request passes through rather than erroring.
 */
export async function handlePlayerProxy(req: NextRequest) {
  // While the portal is hidden the page is a static 404 already.
  if (!portalIsPublic()) return NextResponse.next();
  const segment = req.nextUrl.pathname.slice(PLAYERS_PREFIX.length);
  // Only the profile itself: the sitemap and deeper paths route normally.
  if (!segment || segment.includes("/") || segment === "sitemap.xml") {
    return NextResponse.next();
  }
  const parsed = parsePlayerSlugId(segment);
  if (!parsed) return notFoundResponse(req);

  let address: PlayerAddress | null;
  try {
    address = await playerAddress(parsed.id);
  } catch (error) {
    console.warn("Player proxy lookup failed; passing through", error);
    return NextResponse.next();
  }
  if (!address) return notFoundResponse(req);
  if (address.id !== parsed.id || address.slug !== parsed.slug) {
    const url = req.nextUrl.clone();
    url.pathname = playerPath(address);
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

const authProxy = authMiddleware(handleAuthProxy);

/** Player URLs skip Clerk entirely; everything else matched is auth. */
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname.startsWith(PLAYERS_PREFIX)) {
    return handlePlayerProxy(req);
  }
  return authProxy(req, event);
}

export const config = {
  matcher: [
    "/players/:slugId",
    "/admin/:path*",
    "/vote/:path*",
    "/onboarding/:path*",
    "/api/vote/:path*",
  ],
};
