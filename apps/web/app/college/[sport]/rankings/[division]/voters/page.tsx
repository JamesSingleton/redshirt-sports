import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { sportInfoBySlug } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RankingsBreadcrumb } from "@/components/rankings/rankings-breadcrumb";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { RankingsVotersPanel } from "@/components/rankings/rankings-voters-panel";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedLatestFinalRankings,
  getCachedPollWeekBallotContext,
  getCachedActivePollVoters,
} from "@/lib/rankings-data";
import { buildRankingsTabs, rankingsMethodologyHref } from "@/lib/rankings-nav";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { sportNavLabel } from "@/lib/sport-nav";
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
  return draftAwareParamsPage(
    params,
    <RankingsTabSkeleton variant="voters" />,
    (resolved) => renderVotersPage(resolved),
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
  const rankingsIndexHref = `/college/${sport}/rankings`;
  const methodologyHref = rankingsMethodologyHref(sport, division);

  const latest = await getCachedLatestFinalRankings({ division });
  if (!latest) {
    notFound();
  }

  const weekSegment = formatWeekSegment(latest.week);
  const tabs = buildRankingsTabs({
    sport,
    division,
    year: String(latest.year),
    weekSegment,
  });

  const [voters, ballotContext, sportMeta] = await Promise.all([
    getCachedActivePollVoters({ division, sport: sportParam }),
    getCachedPollWeekBallotContext({
      year: latest.year,
      week: latest.week,
      division,
      sport: sportParam,
    }),
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sportParam },
      perspective: "published",
      stega: false,
    }),
  ]);

  const sportTitle = sportMeta.data?.title as string | undefined;
  const sportLabel = sportNavLabel(sportParam, sportTitle ?? sport);

  const weekPath = `/college/${sport}/rankings/${division}/${latest.year}/${weekSegment}`;
  const byVoterHref = `${weekPath}/ballots/by-voter`;

  const voterRows = voters.map((row) => {
    const created = row.createdAt;
    const onPanelSince =
      created instanceof Date
        ? created.getFullYear().toString()
        : created
          ? String(created).slice(0, 4)
          : "—";
    return {
      id: row.id,
      name: `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim(),
      organization: row.user.organization ?? "",
      organizationRole: row.user.organizationRole ?? "",
      onPanelSince,
      ballotsSubmittedLabel: "—",
      disclosure: null,
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
    <main className="mx-auto max-w-site px-4 lg:px-6">
      <div className="pt-5">
        <RankingsBreadcrumb
          sport={sport}
          sportLabel={sportLabel}
          divisionName={divisionName}
          rankingsIndexHref={rankingsIndexHref}
        />
        <div className="mt-3">
          <div className="kicker text-primary">
            Redshirt Sports Poll · {divisionName}
          </div>
          <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
            {divisionName} Poll Voters
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {latest.year} panel · {voterRows.length} voters · published by
            admins each season ·{" "}
            <Link
              href={methodologyHref}
              prefetch={false}
              className="text-primary underline-offset-2 hover:underline"
            >
              Methodology
            </Link>
          </p>
        </div>
      </div>

      <RankingsTabs tabs={tabs} active="voters" />

      <RankingsVotersPanel
        voters={voterRows}
        seasonYear={latest.year}
        divisionName={divisionName}
        ballotsSubmittedLabel={ballotsSubmittedLabel}
        outletCount={outletCount}
        disclosureCount={0}
        methodologyHref={methodologyHref}
      />
    </main>
  );
}
