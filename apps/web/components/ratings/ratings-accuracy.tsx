import Link from "next/link";

import {
  formatPct,
  type PickRecord,
  type PredictionSummary,
} from "@/lib/ratings/accuracy";
import type { ValidationReport } from "@/lib/ratings/validation";

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="font-display text-4xl font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-sm">{detail}</p>
    </div>
  );
}

/**
 * Horizontal bars of right-winner percentage, one hue, value printed on every
 * bar, with the 50% coin-flip line for reference. Each row is a hover target.
 */
function PickBars({
  rows,
  caption,
}: {
  rows: Array<PickRecord & { label: string }>;
  caption: string;
}) {
  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <div
        aria-hidden
        className="text-muted-foreground mb-1 grid grid-cols-[9rem_1fr_7.5rem] gap-3 text-xs"
      >
        <span />
        <span className="relative h-4">
          <span className="absolute left-1/2 -translate-x-1/2">
            50% (coin flip)
          </span>
        </span>
        <span />
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="grid grid-cols-[9rem_1fr_7.5rem] items-center gap-3 text-sm"
            title={`${row.label}: ${row.correct} of ${row.games} right (${formatPct(row.pct)}), average miss ${row.averageMiss.toFixed(1)} points`}
          >
            <span className="truncate">{row.label}</span>
            <span className="bg-muted relative h-5 rounded">
              <span
                className="bg-primary absolute inset-y-0 left-0 rounded-r"
                style={{ width: `${Math.max(row.pct * 100, 1)}%` }}
              />
              <span
                aria-hidden
                className="bg-foreground/70 absolute inset-y-[-3px] left-1/2 w-0.5 -translate-x-1/2"
              />
            </span>
            <span className="text-right tabular-nums">
              {formatPct(row.pct)}{" "}
              <span className="text-muted-foreground text-xs">
                {row.correct}/{row.games}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/**
 * How well the ratings pick games they haven't seen: every pick was made from
 * the ratings published before that week's games.
 */
export function RatingsAccuracy({
  poolName,
  summary,
  report,
  methodologyHref,
  ratingsHref,
}: {
  poolName: string;
  summary: PredictionSummary;
  report: ValidationReport | null;
  methodologyHref: string;
  ratingsHref: string;
}) {
  const { current, currentYear } = summary;
  return (
    <div className="flex max-w-4xl flex-col gap-10 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          <Link href={ratingsHref} className="hover:underline">
            {poolName} ratings
          </Link>
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          How accurate are the {poolName} ratings?
        </h1>
        <p className="text-muted-foreground">
          Every week, before any games are played, the ratings pick a winner in
          each {poolName}-vs-{poolName} game: the team with more Power, plus
          home field. This page is the record of those picks. Each one used only
          the ratings published before kickoff, so nothing here was graded with
          hindsight.{" "}
          <Link href={methodologyHref} className="underline">
            How the ratings work
          </Link>
          .
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={`${currentYear ?? "This"} season`}
          value={formatPct(current.pct)}
          detail={`${current.correct} of ${current.games} winners right`}
        />
        <StatTile
          label="Average miss"
          value={`${current.averageMiss.toFixed(1)} pts`}
          detail="Predicted vs. actual margin, this season"
        />
        <StatTile
          label="All seasons"
          value={formatPct(summary.allTime.pct)}
          detail={`${summary.allTime.correct} of ${summary.allTime.games} winners right`}
        />
      </section>

      <section>
        <h2 className="font-display mb-1 text-xl font-bold">
          {currentYear} week by week
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Some weeks are full of upsets. A single week can swing a lot, so the
          season total matters more than any one week.
        </p>
        <PickBars
          rows={summary.weeks}
          caption={`Share of ${poolName} games picked right each week of ${currentYear}`}
        />
      </section>

      <section>
        <h2 className="font-display mb-1 text-xl font-bold">
          Close games vs. mismatches
        </h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Grouped by how big the favorite was, in predicted points, across every
          season. When the ratings call a game close, it is close: those land
          near 50%. Big favorites almost always win.
        </p>
        <PickBars
          rows={summary.buckets.filter((bucket) => bucket.games > 0)}
          caption="Share of games picked right by predicted margin"
        />
      </section>

      <section>
        <h2 className="font-display mb-1 text-xl font-bold">Every season</h2>
        <p className="text-muted-foreground mb-3 text-sm">
          Every pick in every season was made the same way: from the ratings as
          they stood before that week's games.
        </p>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-left text-xs">
            <tr>
              <th className="py-1 pr-4">Season</th>
              <th className="py-1 pr-4">Games</th>
              <th className="py-1 pr-4">Winners right</th>
              <th className="py-1">Average miss</th>
            </tr>
          </thead>
          <tbody>
            {summary.seasons.map((season) => (
              <tr key={season.year} className="border-t">
                <td className="py-1.5 pr-4">{season.year}</td>
                <td className="py-1.5 pr-4 tabular-nums">{season.games}</td>
                <td className="py-1.5 pr-4 tabular-nums">
                  {formatPct(season.pct)}
                </td>
                <td className="py-1.5 tabular-nums">
                  {season.averageMiss.toFixed(1)} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {report && report.championRanks.length > 0 ? (
        <section>
          <h2 className="font-display mb-1 text-xl font-bold">
            Where each champion finished
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">
            Final ratings after the title game.
          </p>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="py-1 pr-4">Season</th>
                <th className="py-1 pr-4">Champion</th>
                <th className="py-1 pr-4">Strength of record</th>
                <th className="py-1 pr-4">Power</th>
                <th className="py-1">Strength of schedule</th>
              </tr>
            </thead>
            <tbody>
              {report.championRanks.map((row) => (
                <tr key={row.year} className="border-t">
                  <td className="py-1.5 pr-4">{row.year}</td>
                  <td className="py-1.5 pr-4">{row.champion ?? "—"}</td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {row.sorRank ? `#${row.sorRank}` : "—"}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {row.powerRank ? `#${row.powerRank}` : "—"}
                  </td>
                  <td className="py-1.5 tabular-nums">
                    {row.sosRank ? `#${row.sosRank}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
