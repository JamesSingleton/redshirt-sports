"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RankingsBreadcrumb } from "@/components/rankings/rankings-breadcrumb";
import { RankingsFilters } from "@/components/rankings/filters";
import { RankingsShareButton } from "@/components/rankings/rankings-share-button";
import { RankingsTabsNav } from "@/components/rankings/rankings-tabs-nav";
import type { loadRankingsWeekShell } from "@/lib/rankings-week-shell";

type WeekShell = Awaited<ReturnType<typeof loadRankingsWeekShell>>;

function shareTitleForPath(shell: WeekShell, pathname: string) {
  if (pathname.includes("/ballots")) {
    return `${shell.divisionName} Ballots · ${shell.titleWeek}`;
  }
  return `${shell.divisionName} Top 25 · ${shell.titleWeek}`;
}

function headingForPath(shell: WeekShell, pathname: string) {
  if (pathname.includes("/ballots/by-voter")) {
    return (
      <>
        {shell.divisionName}{" "}
        <span className="text-muted-foreground">
          · {shell.titleWeek} Ballots · By voter
        </span>
      </>
    );
  }
  if (pathname.includes("/ballots")) {
    return (
      <>
        {shell.divisionName}{" "}
        <span className="text-muted-foreground">
          · {shell.titleWeek} Ballots
        </span>
      </>
    );
  }
  return (
    <>
      {shell.divisionName} Top 25{" "}
      <span className="text-muted-foreground">· {shell.titleWeek}</span>
    </>
  );
}

export function RankingsWeekChromeClient({ shell }: { shell: WeekShell }) {
  const pathname = usePathname();
  const shareTitle = shareTitleForPath(shell, pathname);
  return (
    <>
      <div className="pt-5">
        <RankingsBreadcrumb
          sport={shell.sportParam}
          sportLabel={shell.sportLabel}
          divisionName={shell.divisionName}
          rankingsIndexHref={shell.rankingsIndexHref}
        />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="kicker text-primary">
              Redshirt Sports Poll · {shell.divisionName}
            </div>
            <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
              {headingForPath(shell, pathname)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <Link
                href={shell.methodologyHref}
                prefetch={false}
                className="text-primary underline-offset-2 hover:underline"
              >
                Methodology
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RankingsFilters
              years={shell.yearsWithVotes}
              weeks={shell.weeksWithVotes}
            />
            <RankingsShareButton title={shareTitle} />
          </div>
        </div>
      </div>

      <RankingsTabsNav tabs={shell.tabs} />
    </>
  );
}
