import { NextResponse } from "next/server";

import { resolvePublicRankings } from "@/lib/rankings-api";
import { rankingsApiRatelimit } from "@/server/ratelimit";
import { parseWeekSegment } from "@/utils/espn";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
} as const;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "anonymous";
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: CORS_HEADERS,
    },
  );
}

export function rankingsApiOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function handleRankingsApiGet(
  request: Request,
  {
    sport,
    division,
    year: yearParam,
    week: weekParam,
  }: {
    sport: string;
    division: string;
    year?: string;
    week?: string;
  },
) {
  const { success: withinRateLimit } = await rankingsApiRatelimit.limit(
    `rankings-api:${clientIp(request)}`,
  );
  if (!withinRateLimit) {
    return jsonError("Too many requests. Please try again shortly.", 429);
  }

  let year: number | undefined;
  let week: number | undefined;

  if (yearParam != null || weekParam != null) {
    if (yearParam == null || weekParam == null) {
      return jsonError("Both year and week are required", 400);
    }

    const parsedYear = Number.parseInt(yearParam, 10);
    if (!Number.isInteger(parsedYear) || parsedYear < 1900) {
      return jsonError(`Invalid year: ${yearParam}`, 400);
    }

    try {
      week = parseWeekSegment(weekParam);
    } catch {
      return jsonError(
        `Invalid week: ${weekParam}. Use a number, "preseason", or "final-rankings".`,
        400,
      );
    }
    year = parsedYear;
  }

  try {
    const result = await resolvePublicRankings({
      sportSlug: sport,
      divisionSlug: division,
      year,
      week,
    });

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json(result.body, {
      headers: {
        ...CORS_HEADERS,
        ...CACHE_HEADERS,
      },
    });
  } catch (error) {
    console.error("Rankings API error:", error);
    return jsonError("Internal server error", 500);
  }
}
