import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RankingsVotersPanel } from "@/components/rankings/rankings-voters-panel";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { formatVoterSince } from "@/lib/format-voter-since";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedActivePollVoters,
  getCachedLatestFinalRankings,
  getCachedPollVoterBallotStatsForSeason,
  getCachedPollWeekBallotContext,
} from "@/lib/rankings-data";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import { voterBallotSlug } from "@/lib/voter-ballot-slug";
import type { SportParam } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const divisionName = pollDivisionLabel(division);
  return getPageMetadata(
    {
      title: `${divisionName} Poll Voters`,
      description: `Meet the credentialed voters on the ${divisionName} Top 25 panel.`,
      slug: `/college/${sport}/rankings/${division}/voters`,
    },
    "published",
  );
}

export default function RankingsVotersPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  return draftAwareParamsPage(params, null, (resolved) =>
    renderVotersPage(resolved),
  );
}

async function renderVotersPage({
  sport,
  division,
}: {
  sport: string;
  division: string;
}) {
  const sportParam = sport as SportParam;
  const divisionName = pollDivisionLabel(division);
  const methodologyHref = rankingsMethodologyHref(sport, division);

  const latest = await getCachedLatestFinalRankings({ division });
  if (!latest) {
    notFound();
  }

  const [voters, ballotContext, ballotStats] = await Promise.all([
    getCachedActivePollVoters({ division, sport: sportParam }),
    getCachedPollWeekBallotContext({
      year: latest.year,
      week: latest.week,
      division,
      sport: sportParam,
    }),
    getCachedPollVoterBallotStatsForSeason({
      division,
      sport: sportParam,
      year: latest.year,
    }),
  ]);

  const weekPath = `/college/${sport}/rankings/${division}/${latest.year}/${formatWeekSegment(latest.week)}`;
  const byVoterHref = `${weekPath}/ballots/by-voter`;

  const voterRows = voters.map((row) => {
    const stats = ballotStats.get(row.userId);
    return {
      id: row.id,
      name: `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim(),
      organization: row.user.organization ?? "",
      organizationRole: row.user.organizationRole ?? "",
      ballotsSubmittedLabel: String(stats?.seasonBallotCount ?? 0),
      voterSinceLabel: formatVoterSince(stats?.voterSince),
      latestBallotHref: `${byVoterHref}?voter=${voterBallotSlug(
        `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim(),
      )}`,
    };
  });

  const ballotsCounted = ballotContext?.ballotsCounted ?? 0;
  const ballotsSubmittedLabel = `${ballotsCounted} / ${voterRows.length}`;
  const outletCount = new Set(
    voterRows.map((v) => v.organization).filter(Boolean),
  ).size;

  return (
    <>
      <div className="mt-3">
        <div className="kicker text-primary">
          Redshirt Sports Poll · {divisionName}
        </div>
        <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
          {divisionName} Poll Voters
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {latest.year} panel · {voterRows.length} voters · published by admins
          each season ·{" "}
          <Link
            href={methodologyHref}
            prefetch={false}
            className="text-primary underline-offset-2 hover:underline"
          >
            Methodology
          </Link>
        </p>
      </div>

      <RankingsVotersPanel
        voters={voterRows}
        seasonYear={latest.year}
        divisionName={divisionName}
        ballotsSubmittedLabel={ballotsSubmittedLabel}
        outletCount={outletCount}
        methodologyHref={methodologyHref}
      />
    </>
  );
}
