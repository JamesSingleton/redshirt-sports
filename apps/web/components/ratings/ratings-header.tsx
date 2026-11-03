import Link from "next/link";

import { RatingsDownloadMenu } from "@/components/ratings/ratings-download-menu";
import { RatingsWeekPicker } from "@/components/ratings/ratings-week-picker";
import type { RatingsWeekModel } from "@/lib/ratings/data";
import {
  formatThrough,
  RATINGS_METHODOLOGY_PATH,
  ratingsPaths,
} from "@/lib/ratings/format";
import { sportNavLabel } from "@/lib/sport-nav";

export function ratingsTitle(model: Pick<RatingsWeekModel, "pool">) {
  return `${model.pool.name} ${sportNavLabel(model.pool.sportSlug, model.pool.sportName)} Ratings & Strength of Schedule`;
}

export function pickerWeeks(model: Pick<RatingsWeekModel, "weeks">) {
  return model.weeks.map(({ year, segment, label }) => ({
    year,
    segment,
    label,
  }));
}

/** Title, as-of line, season/week pickers, and links to the method, accuracy, and data. */
export function RatingsHeader({ model }: { model: RatingsWeekModel }) {
  const { pool, week } = model;
  const paths = ratingsPaths(pool.sportSlug, pool.slug);
  const through = formatThrough(week.throughAt);

  return (
    <header className="flex flex-col gap-4 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Computer ratings · {pool.name} vs {pool.name} games only
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {ratingsTitle(model)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {week.year} {week.label}
          {through ? ` · through ${through}` : ""}
          {model.isLatest ? " · latest" : ""}
        </p>
      </div>

      {model.run.diagnostics.leagueProvisional ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Early-season ratings are provisional: too few {pool.name} games
          connect the league yet, so last season still carries real weight.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RatingsWeekPicker
          weeks={pickerWeeks(model)}
          year={week.year}
          segment={week.segment}
          basePath={paths.latest}
        />
        <nav
          aria-label="Ratings pages"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
        >
          <Link
            href={RATINGS_METHODOLOGY_PATH}
            className="font-medium hover:underline"
          >
            How it works
          </Link>
          <Link href={paths.accuracy} className="hover:underline">
            Accuracy
          </Link>
          <Link
            href={paths.teamSheets(week.year, week.segment)}
            className="hover:underline"
          >
            Team sheets
          </Link>
          <RatingsDownloadMenu
            weekLabel={`${week.year} ${week.label}`}
            year={week.year}
            csvHref={paths.data(week.year, week.segment, "csv")}
            jsonHref={paths.data(week.year, week.segment, "json")}
            seasonHref={paths.seasonWorkbook(week.year)}
          />
        </nav>
      </div>
    </header>
  );
}
