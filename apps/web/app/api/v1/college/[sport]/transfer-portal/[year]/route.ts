import { NextResponse } from "next/server";

import {
  getCachedPortalWire,
  isPortalSport,
  parseCycleYear,
  portalIsPublic,
} from "@/lib/portal-data";
import { clientIp } from "@/lib/rankings-api-route";
import { portalApiRatelimit } from "@/server/ratelimit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

/**
 * Short at the edge so a push shows up within a minute; the data behind it
 * is the shared remote cache, so a miss is a function call, not a query.
 */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
} as const;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * One sport's transfer portal wire for one cycle, every move. The wire page
 * loads it when someone filters or asks for more than the first rows.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sport: string; year: string }> },
) {
  if (!portalIsPublic()) return jsonError("Not found", 404);
  const { sport, year: yearParam } = await params;
  const year = parseCycleYear(yearParam);
  if (!isPortalSport(sport) || year === null) {
    return jsonError("Not found", 404);
  }

  // Fail open: the wire page's own filters depend on this route, and the data
  // behind it is cached, so an unreachable limiter shouldn't take it down.
  const allowed = await portalApiRatelimit
    .limit(`portal-api:${clientIp(request)}`)
    .then((result) => result.success)
    .catch((error: unknown) => {
      console.warn("Transfer portal rate limiter unavailable:", error);
      return true;
    });
  if (!allowed) {
    return jsonError("Too many requests. Please try again shortly.", 429);
  }

  try {
    const wire = await getCachedPortalWire(sport, year);
    if (!wire) return jsonError("Not found", 404);
    return NextResponse.json(wire, {
      headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
    });
  } catch (error) {
    console.error("Transfer portal API error:", error);
    return jsonError("Internal server error", 500);
  }
}
