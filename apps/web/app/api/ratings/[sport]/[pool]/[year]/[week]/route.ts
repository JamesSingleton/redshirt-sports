import { getBaseUrl } from "@/lib/get-base-url";
import { clientIp } from "@/lib/rankings-api-route";
import { loadRatingsWeek } from "@/lib/ratings/data";
import { ratingsCsv, ratingsJson } from "@/lib/ratings/export";
import { ratingsPaths } from "@/lib/ratings/format";
import { rankingsApiRatelimit } from "@/server/ratelimit";

/** Published weeks never change in place, so CDN caching is safe; publishing a new run changes the content. */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
} as const;

/**
 * Bulk download of one published week, open to everyone like the public rankings
 * API, and rate-limited per IP on the same budget. Every file carries the license,
 * attribution, and run checksum.
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      sport: string;
      pool: string;
      year: string;
      week: string;
    }>;
  },
) {
  // A rate-limiter outage shouldn't take downloads down with it.
  const { success } = await rankingsApiRatelimit
    .limit(`ratings-data:${clientIp(request)}`)
    .catch((error: unknown) => {
      console.error("Ratings download rate limit unavailable", error);
      return { success: true };
    });
  if (!success) {
    return Response.json(
      { error: "Too many downloads. Try again shortly." },
      { status: 429 },
    );
  }
  const { sport, pool, year, week } = await params;
  const model = await loadRatingsWeek({ sport, pool, year, week });
  const path = ratingsPaths(sport, pool).week(
    model.week.year,
    model.week.segment,
  );
  const canonical = `${getBaseUrl().replace(/\/$/, "")}${path}`;
  const filename = `redshirt-${sport}-${pool}-${model.week.year}-${model.week.segment}`;
  const format =
    new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  if (format === "json") {
    return new Response(
      JSON.stringify(ratingsJson(model, canonical), null, 2),
      {
        headers: {
          ...CACHE_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      },
    );
  }
  return new Response(ratingsCsv(model, canonical), {
    headers: {
      ...CACHE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
