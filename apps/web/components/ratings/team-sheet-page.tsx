import Link from "next/link";

import { TeamSheet } from "@/components/ratings/team-sheet";
import type { loadRatingsTeam } from "@/lib/ratings/data";
import { RATINGS_METHODOLOGY_PATH, ratingsPaths } from "@/lib/ratings/format";

/** A team sheet with its page chrome; shared by the latest and archived URLs. */
export function TeamSheetPage({
  data,
}: {
  data: Awaited<ReturnType<typeof loadRatingsTeam>>;
}) {
  const { model, row } = data;
  const { pool, week } = model;
  const paths = ratingsPaths(pool.sportSlug, pool.slug);
  const slugById = new Map(
    model.teams.map((team) => [team.schoolId, team.slug]),
  );
  const opponentHref = (schoolId: string) => {
    const slug = slugById.get(schoolId);
    if (!slug) return null;
    return model.isLatest
      ? paths.team(slug)
      : paths.weekTeam(week.year, week.segment, slug);
  };
  return (
    <div className="flex flex-col gap-4 py-6">
      <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
        <Link
          href={
            model.isLatest ? paths.latest : paths.week(week.year, week.segment)
          }
          className="hover:underline"
        >
          {pool.name} ratings · {week.year} {week.label}
        </Link>
      </p>
      <TeamSheet
        row={row}
        poolName={pool.name}
        teamCount={model.teams.length}
        opponentHref={opponentHref}
        benchmark={model.run.params.benchmark}
        sigma={model.run.params.sigma}
      />
      <p className="text-muted-foreground text-xs">
        <Link href={RATINGS_METHODOLOGY_PATH} className="underline">
          How every number here is computed
        </Link>
        {row.slug ? (
          <>
            {" · "}
            <Link href={`/college/teams/${row.slug}`} className="underline">
              {row.name} team page
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
