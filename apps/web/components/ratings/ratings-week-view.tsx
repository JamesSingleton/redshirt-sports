import { JsonLdScript } from "@/components/json-ld";
import { RatingsHeader } from "@/components/ratings/ratings-header";
import { RatingsTable } from "@/components/ratings/ratings-table";
import type { RatingsWeekModel } from "@/lib/ratings/data";
import { buildRatingsDatasetJsonLd } from "@/lib/ratings/dataset-json-ld";
import { ratingsPaths, type SortDir, type SortKey } from "@/lib/ratings/format";

/** The latest page and every archived week render the same view. */
export function RatingsWeekView({
  model,
  sort,
  dir = "asc",
  basePath,
}: {
  model: RatingsWeekModel;
  sort: SortKey;
  dir?: SortDir;
  basePath: string;
}) {
  const { pool, week } = model;
  const paths = ratingsPaths(pool.sportSlug, pool.slug);
  const teamHref = (slug: string) =>
    model.isLatest
      ? paths.team(slug)
      : paths.weekTeam(week.year, week.segment, slug);
  return (
    <>
      <JsonLdScript
        id="ratings-dataset"
        data={buildRatingsDatasetJsonLd(model, basePath)}
      />
      <RatingsHeader model={model} />
      <RatingsTable
        rows={model.rows}
        poolName={pool.name}
        benchmark={model.run.params.benchmark}
        sort={sort}
        dir={dir}
        basePath={basePath}
        teamHref={teamHref}
      />
      <p className="text-muted-foreground py-4 text-xs">
        Only games between two {pool.name} teams count. Method v
        {model.run.methodVersion} · {model.run.gameCount} {pool.name} games ·
        run {model.run.checksum.slice(0, 12)}
      </p>
    </>
  );
}
