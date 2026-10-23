import { buildRankingsTabs } from "@/lib/rankings-nav";

/** Matches `/college/{sport}/rankings/{division}/{year}/{weekSegment}` (and deeper paths). */
const RANKINGS_WEEK_PATH =
  /\/college\/[^/]+\/rankings\/([^/]+)\/(\d{4})\/([^/]+)/;

export function buildRankingsTabsForPathname(
  pathname: string,
  sport: string,
  division: string,
  fallback: { year: string; weekSegment: string },
) {
  const match = pathname.match(RANKINGS_WEEK_PATH);
  const pathDivision = match?.[1];
  const year = match?.[2] ?? fallback.year;
  const weekSegment = match?.[3] ?? fallback.weekSegment;

  if (pathDivision && pathDivision !== division) {
    return buildRankingsTabs({ sport, division, ...fallback });
  }

  return buildRankingsTabs({ sport, division, year, weekSegment });
}
