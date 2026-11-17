import { searchPublishedPlayers } from "@redshirt-sports/db/queries";
import { NextResponse } from "next/server";

import { portalIsPublic } from "@/lib/portal-data";
import { clientIp } from "@/lib/rankings-api-route";
import { portalApiRatelimit } from "@/server/ratelimit";

/**
 * Player search for the Studio's player picker: articles store our player's
 * id, never the player. Only published players are returned, and nothing
 * while the portal is hidden. Open and CORS-enabled like the game search,
 * and rate limited.
 */
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

export async function GET(request: Request) {
  if (!portalIsPublic()) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: HEADERS },
    );
  }
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (term.length < 3 || term.length > 60) {
    return NextResponse.json(
      { error: "Search with 3 to 60 characters, e.g. ?q=brooks" },
      { status: 400, headers: HEADERS },
    );
  }

  // Fails open like the tracker's JSON: a limiter outage shouldn't break the picker.
  const allowed = await portalApiRatelimit
    .limit(`players-search:${clientIp(request)}`)
    .then((result) => result.success)
    .catch((error: unknown) => {
      console.warn("Player search rate limiter unavailable:", error);
      return true;
    });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: HEADERS },
    );
  }

  const players = await searchPublishedPlayers(term);
  return NextResponse.json(
    { players },
    {
      headers: {
        ...HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    },
  );
}
