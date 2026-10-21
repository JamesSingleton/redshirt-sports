import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RankingsMethodologyContent } from "@/components/rankings/rankings-methodology-content";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedPollWeekBallotContext } from "@/lib/rankings-data";
import { loadRankingsDivisionShell } from "@/lib/rankings-week-shell";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import type { SportParam } from "@/utils/espn";
import { weekTitle } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const divisionName = pollDivisionLabel(division);
  return getPageMetadata(
    {
      title: `How our ${divisionName} Top 25 poll works`,
      description:
        "Points, transparency, ballot windows, and outlier policy for Redshirt Sports polls.",
      slug: `/college/${sport}/rankings/${division}/methodology`,
    },
    "published",
  );
}

export default function RankingsDivisionMethodologyPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  return draftAwareParamsPage(params, null, (resolved) =>
    renderMethodologyPage(resolved),
  );
}

async function renderMethodologyPage({
  sport,
  division,
}: {
  sport: string;
  division: string;
}) {
  const shell = await loadRankingsDivisionShell({ sport, division });
  if (!shell) {
    notFound();
  }

  const sportParam = sport as SportParam;
  const ballotContext = await getCachedPollWeekBallotContext({
    year: shell.yearNumber,
    week: shell.weekNumber,
    division,
    sport: sportParam,
  });

  return (
    <>
      <div className="mt-3">
        <div className="kicker text-primary">Redshirt Sports Poll</div>
        <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
          How the Top 25 works
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Applies to every Redshirt Sports {shell.sportLabel} poll ·{" "}
          {shell.divisionName} example shown
        </p>
      </div>

      <RankingsMethodologyContent
        sport={sport}
        rankingsIndexHref={shell.rankingsIndexHref}
        ballotsHref={shell.ballotsHref}
        byVoterHref={shell.byVoterHref}
        ballotsCounted={ballotContext?.ballotsCounted ?? 0}
        voterChips={ballotContext?.voterChips ?? []}
        weekLabel={weekTitle(shell.weekNumber)}
        panelSize={
          ballotContext?.voterChips.length ?? ballotContext?.ballotsCounted ?? 0
        }
      />
    </>
  );
}
