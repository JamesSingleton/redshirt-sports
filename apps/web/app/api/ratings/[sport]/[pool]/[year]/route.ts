import { getBaseUrl } from "@/lib/get-base-url";
import { clientIp } from "@/lib/rankings-api-route";
import { loadRatingsSeasonRuns } from "@/lib/ratings/data";
import { ratingsSeasonWorkbook } from "@/lib/ratings/export";
import { ratingsPaths } from "@/lib/ratings/format";
import { rankingsApiRatelimit } from "@/server/ratelimit";

/**
 * A whole season as one Excel workbook: a sheet per published week plus an
 * About sheet. Open to everyone, rate-limited per IP like the week download.
 */
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ sport: string; pool: string; year: string }> },
) {
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
  const { sport, pool, year } = await params;
  const season = await loadRatingsSeasonRuns({ sport, pool, year });
  const canonical = `${getBaseUrl().replace(/\/$/, "")}${ratingsPaths(sport, pool).latest}`;
  const body = ratingsSeasonWorkbook(season, canonical);
  return new Response(body as unknown as BodyInit, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="redshirt-${sport}-${pool}-${year}.xlsx"`,
    },
  });
}
