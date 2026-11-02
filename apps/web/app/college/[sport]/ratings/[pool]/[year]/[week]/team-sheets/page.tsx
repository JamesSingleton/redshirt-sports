import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { pickerWeeks } from "@/components/ratings/ratings-header";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { RatingsWeekPicker } from "@/components/ratings/ratings-week-picker";
import { TeamSheet, TierLegend } from "@/components/ratings/team-sheet";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { loadRatingsSheets, loadRatingsWeek } from "@/lib/ratings/data";
import { ratingsPaths, sortRows } from "@/lib/ratings/format";

type Params = Promise<{
  sport: string;
  pool: string;
  year: string;
  week: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { sport, pool, year, week } = await params;
  const model = await loadRatingsWeek({ sport, pool, year, week });
  return getPageMetadata({
    title: `${model.week.year} ${model.week.label} ${model.pool.name} Team Sheets`,
    slug: ratingsPaths(sport, pool).teamSheets(
      model.week.year,
      model.week.segment,
    ),
    noIndex: true,
  });
}

/** Every team's sheet on one page, one per printed page, in SOR order. For committee packets. */
async function TeamSheets({ params }: { params: Params }) {
  const { sport, pool, year, week } = await params;
  const model = await loadRatingsSheets({ sport, pool, year, week });
  const paths = ratingsPaths(sport, pool);
  return (
    <div className="flex flex-col gap-10 py-6">
      <div className="flex flex-col gap-4 print:break-after-page">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase print:hidden">
          <Link
            href={paths.week(model.week.year, model.week.segment)}
            className="hover:underline"
          >
            Back to the {model.pool.name} table
          </Link>
        </p>
        <h1 className="font-display text-3xl font-bold print:text-xl">
          {model.week.year} {model.week.label} {model.pool.name} team sheets
        </h1>
        <div className="print:hidden">
          <RatingsWeekPicker
            weeks={pickerWeeks(model)}
            year={model.week.year}
            segment={model.week.segment}
            basePath={paths.latest}
            suffix="/team-sheets"
          />
        </div>
        <section>
          <h2 className="mb-2 font-semibold">Results by opponent quality</h2>
          <TierLegend />
        </section>
      </div>
      {sortRows(model.rows, "sor").map((row) => (
        <div key={row.schoolId} className="print:break-after-page">
          <TeamSheet
            row={row}
            poolName={model.pool.name}
            teamCount={model.rows.length}
            opponentHref={() => null}
            benchmark={model.run.params.benchmark}
            sigma={model.run.params.sigma}
            showTierLegend={false}
          />
        </div>
      ))}
    </div>
  );
}

export default function TeamSheetsPage(props: { params: Params }) {
  return (
    <Suspense fallback={<RatingsSkeleton />}>
      <TeamSheets {...props} />
    </Suspense>
  );
}
