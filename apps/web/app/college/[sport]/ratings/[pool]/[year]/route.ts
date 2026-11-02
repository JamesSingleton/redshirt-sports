import { loadRatingsSeason } from "@/lib/ratings/data";
import { ratingsPaths } from "@/lib/ratings/format";

/**
 * A season has no page of its own: send it to its latest published week with a
 * real redirect (crawlers and link checkers see a 307, not a client-side hop).
 * Unknown seasons 404.
 */
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ sport: string; pool: string; year: string }> },
) {
  const { sport, pool, year } = await params;
  const { weeks } = await loadRatingsSeason({ sport, pool, year });
  const latest = weeks[weeks.length - 1];
  return Response.redirect(
    new URL(
      ratingsPaths(sport, pool).week(year, latest?.segment ?? ""),
      request.url,
    ),
    307,
  );
}
