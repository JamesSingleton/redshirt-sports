import type { PublishedTeamRow } from "@redshirt-sports/db/ratings";
import Link from "next/link";

import { TeamLogo } from "@/components/ratings/team-logo";
import { ratingsColumns } from "@/lib/ratings/columns";
import {
  formatPoints,
  formatRecord,
  formatScore,
  formatSor,
  type SortDir,
  type SortKey,
  sortHref,
  sortRows,
} from "@/lib/ratings/format";
import { scaleGuide } from "@/lib/ratings/scale";

function rankFor(row: PublishedTeamRow, key: SortKey): number | null {
  switch (key) {
    case "sor":
      return row.sorRank;
    case "power":
      return row.powerRank;
    case "sos":
      return row.sosRank;
    case "sov":
      return row.sovRank;
    case "record-sos":
      return row.recordSosRank;
    case "remaining":
      return null;
  }
}

function ScaleItem({
  label,
  parts,
}: {
  label: string;
  parts: Array<[string, string]>;
}) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="text-muted-foreground tabular-nums">
        {parts.map(([name, value]) => `${name} ${value}`).join(" · ")}
      </dd>
    </div>
  );
}

/** Reference points from this week, so "+22.8" or "47.8" has something to compare to. */
export function RatingsScale({
  rows,
  poolName,
  benchmark,
}: {
  rows: PublishedTeamRow[];
  poolName: string;
  /** The #25-level team's strength for this run. */
  benchmark: number;
}) {
  const guide = scaleGuide(rows);
  return (
    <div className="mb-3 rounded-xl border p-3 text-sm">
      <p className="mb-2 font-medium">How this week's numbers compare</p>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
        <ScaleItem
          label="Power (0 = average team)"
          parts={[
            ["#1", formatPoints(guide.power.best)],
            ["#10", formatPoints(guide.power.tenth)],
            ["middle", formatPoints(guide.power.middle)],
          ]}
        />
        <ScaleItem
          label="SOS (higher is harder)"
          parts={[
            ["hardest", formatScore(guide.sos.hardest)],
            ["#10", formatScore(guide.sos.tenth)],
            ["middle", formatScore(guide.sos.middle)],
            ["easiest", formatScore(guide.sos.easiest)],
          ]}
        />
        <ScaleItem
          label="SOR (lower is better)"
          parts={[
            ["#1", formatSor(guide.sor.best)],
            ["#25", formatSor(guide.sor.twentyFifth)],
          ]}
        />
      </dl>
      <p className="text-muted-foreground mt-2 text-xs">
        Power is in points: a +20 team would be favored by about 20 over an
        average {poolName} team on a neutral field, and by 10 over a +10 team.
        SOS, SOR, and SOV are measured against a <strong>#25-level team</strong>
        : one as strong as the 25th-best team in these ratings usually is at
        season's end ({formatPoints(benchmark)} points). That comes from these
        ratings, not the poll. An SOS of 50 means a #25-level team would lose
        about half of these games; above 50, the opponents were, on average,
        better than that.
      </p>
    </div>
  );
}

/** What each column means, above the table so no number is unexplained. */
export function RatingsLegend({ poolName }: { poolName: string }) {
  return (
    <details className="mb-3 rounded-xl border p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        What these columns mean
      </summary>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="font-medium">#</dt>
          <dd className="text-muted-foreground">
            Rank in the column you sorted by (strength of record unless you pick
            another). "—" means too few {poolName} games to rank.
          </dd>
        </div>
        {ratingsColumns(poolName).map((column) => (
          <div key={column.label}>
            <dt className="font-medium">{column.label}</dt>
            <dd className="text-muted-foreground">{column.meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/**
 * The pool table: one value per column, every column explained in the legend.
 * Sorting is a link (?sort=&dir=), so it works without JavaScript and caches
 * per sort. Clicking the current column flips it; clicking it again resets.
 */
export function RatingsTable({
  rows,
  poolName,
  benchmark,
  sort,
  dir = "asc",
  basePath,
  teamHref,
}: {
  rows: PublishedTeamRow[];
  poolName: string;
  /** The #25-level team's strength for this run (run.params.benchmark). */
  benchmark: number;
  sort: SortKey;
  dir?: SortDir;
  basePath: string;
  teamHref: (slug: string) => string;
}) {
  const sorted = sortRows(rows, sort, dir);
  // Remaining SOS has no stored rank, so number teams by their ascending position.
  const remainingRank = new Map(
    sortRows(rows, "remaining").map((row, index) => [row.schoolId, index + 1]),
  );
  const cols = ratingsColumns(poolName);
  const cell = "px-3 py-2 tabular-nums whitespace-nowrap";
  return (
    <>
      <RatingsScale rows={rows} poolName={poolName} benchmark={benchmark} />
      <RatingsLegend poolName={poolName} />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[60rem] text-sm">
          <caption className="sr-only">
            {poolName} teams sorted by{" "}
            {cols.find((column) => column.key === sort)?.label}
            {dir === "desc" ? ", reversed" : ""}
          </caption>
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="w-12 px-3 py-2 text-right">
                #
              </th>
              <th scope="col" className="px-3 py-2">
                Team
              </th>
              {cols.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  title={column.meaning}
                  aria-sort={
                    column.key === sort
                      ? dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="px-3 py-2 whitespace-nowrap"
                >
                  {column.key ? (
                    <Link
                      href={sortHref(basePath, column.key, { sort, dir })}
                      aria-current={column.key === sort ? "true" : undefined}
                      className={
                        column.key === sort
                          ? "font-semibold underline"
                          : "hover:underline"
                      }
                      scroll={false}
                    >
                      {column.label}
                      {column.key === sort ? (
                        <span aria-hidden="true">
                          {dir === "asc" ? " ↑" : " ↓"}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const rank =
                rankFor(row, sort) ??
                (sort === "remaining" ? remainingRank.get(row.schoolId) : null);
              return (
                <tr key={row.schoolId} className="border-t">
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rank ?? "—"}
                  </td>
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <TeamLogo
                        image={row.image}
                        name={row.name}
                        abbreviation={row.abbreviation}
                      />
                      <span className="flex flex-col">
                        {row.slug ? (
                          <Link
                            href={teamHref(row.slug)}
                            className="font-medium hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{row.name}</span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {row.conference ?? ""}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className={cell}>{formatRecord(row.poolRecord)}</td>
                  <td className={`${cell} text-muted-foreground`}>
                    {formatRecord(row.overallRecord)}
                  </td>
                  <td className={cell}>{formatSor(row.sor)}</td>
                  <td className={cell}>{formatPoints(row.power)}</td>
                  <td className={cell}>{formatScore(row.sos)}</td>
                  <td className={cell}>
                    {row.sosRank ?? (row.poolGames > 0 ? "small sample" : "—")}
                  </td>
                  <td className={cell}>{formatScore(row.sov)}</td>
                  <td className={cell}>
                    {row.recordSos == null ? "—" : row.recordSos.toFixed(3)}
                  </td>
                  <td className={cell}>{formatScore(row.remainingSos)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
