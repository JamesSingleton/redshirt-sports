import { searchGamesForPicker } from "@redshirt-sports/db/queries";
import { NextResponse } from "next/server";

import { clientIp } from "@/lib/rankings-api-route";
import { rankingsApiRatelimit } from "@/server/ratelimit";

/**
 * Game search for the Studio's game picker: articles store the provider's
 * game id, never the game. Schedules are public, so this is open, CORS-enabled,
 * and rate limited like the rankings API.
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
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (term.length < 3 || term.length > 60) {
    return NextResponse.json(
      { error: "Search with 3 to 60 characters, e.g. ?q=montana" },
      { status: 400, headers: HEADERS },
    );
  }

  const { success } = await rankingsApiRatelimit.limit(
    `games-api:${clientIp(request)}`,
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: HEADERS },
    );
  }

  const games = await searchGamesForPicker({ term });
  return NextResponse.json(
    { games },
    {
      headers: {
        ...HEADERS,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
