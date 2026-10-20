import {
  getCachedFinalRankings,
  getCachedLatestFinalRankings,
  getCachedWeeksThatHaveVotes,
} from "@/lib/rankings-data";
import {
  buildRankBySchoolId,
  getMovement,
  getPreviousWeek,
} from "@/lib/rankings-movement";
import { formatWeekSegment, type SportParam, weekTitle } from "@/utils/espn";
import { RankingsCard, type RankingsCardTeam } from "./rankings-card";

/**
 * Server-fetched Top N for the most recent published poll of a division.
 * Renders nothing when the poll has no published rankings (or Postgres is
 * unavailable) so sidebars degrade gracefully instead of failing the page.
 */
export async function LatestRankingsCard({
  sport = "football",
  division = "fcs",
  limit = 10,
  className,
}: {
  sport?: SportParam;
  division?: string;
  limit?: number;
  className?: string;
}) {
  let data: Awaited<ReturnType<typeof loadLatestRankings>>;
  try {
    data = await loadLatestRankings({ sport, division });
  } catch {
    return null;
  }

  if (!data) return null;

  const { year, week, rankings, previousRankings } = data;
  const previousRankById = previousRankings
    ? buildRankBySchoolId(previousRankings)
    : null;

  const teams: RankingsCardTeam[] = rankings
    .filter((team) => team.rank != null && team.rank > 0)
    .slice(0, limit)
    .map((team) => ({
      id: team._id,
      rank: team.rank as number,
      isTie: team.isTie,
      name: team.shortName || team.name || team.abbreviation || "Unknown",
      abbreviation: team.abbreviation,
      slug: team.slug,
      image: team.image,
      movement: previousRankById
        ? getMovement(team.rank, previousRankById.get(team._id))
        : null,
    }));

  if (teams.length === 0) return null;

  return (
    <RankingsCard
      title={`${division.toUpperCase()} Top 25`}
      description={`${weekTitle(week)} · ${year}`}
      teams={teams}
      fullPollHref={`/college/${sport}/rankings/${division}/${year}/${formatWeekSegment(week)}`}
      className={className}
    />
  );
}

async function loadLatestRankings({
  sport,
  division,
}: {
  sport: SportParam;
  division: string;
}) {
  const latest = await getCachedLatestFinalRankings({ division });
  if (!latest) return null;

  const weeks = await getCachedWeeksThatHaveVotes({
    year: latest.year,
    division,
  });
  const previousWeek = getPreviousWeek(weeks, latest.week);

  const [current, previous] = await Promise.all([
    getCachedFinalRankings({
      year: latest.year,
      week: latest.week,
      division,
      sport,
    }),
    previousWeek != null
      ? getCachedFinalRankings({
          year: latest.year,
          week: previousWeek,
          division,
          sport,
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    year: latest.year,
    week: latest.week,
    rankings: current.rankings,
    previousRankings: previous?.rankings ?? null,
  };
}
