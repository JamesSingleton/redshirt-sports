import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Graph } from "schema-dts";

import { AdSlot } from "@/components/ad-slot";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import { RankingsBallotsCta } from "@/components/rankings/rankings-ballots-cta";
import { RankingsBeyondTop25 } from "@/components/rankings/rankings-beyond-top-25";
import { RankingsBiggestMovers } from "@/components/rankings/rankings-biggest-movers";
import { RankingsMovementLegend } from "@/components/rankings/rankings-movement-legend";
import {
  type PollTableTeam,
  RankingsPollTable,
} from "@/components/rankings/rankings-poll-table";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import RankingsPageSkeleton from "@/components/rankings/rankings-page-skeleton";
import { TOP_25 } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  getCachedFinalRankings,
  getCachedPollWeekBallotContext,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
  rankingsWeekTag,
} from "@/lib/rankings-data";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import {
  buildRankBySchoolId,
  getBiggestMovers,
  getDroppedFromVotes,
  getDroppedOutOfTop25,
  getMovement,
  getPreviousWeek,
} from "@/lib/rankings-movement";
import { parseWeekSegment, type SportParam, weekTitle } from "@/utils/espn";

const baseUrl = getBaseUrl();

function resolveYearNumber(year: string): number {
  if (!/^\d{4}$/.test(year)) {
    notFound();
  }
  return Number(year);
}

function resolveWeekNumber(week: string): number {
  try {
    return parseWeekSegment(week);
  } catch {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}): Promise<Metadata> {
  const { division, year, week, sport } = await params;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  resolveYearNumber(year);
  const weekNumber = resolveWeekNumber(week);
  const titleWeek = weekTitle(weekNumber);
  const divisionName = pollDivisionLabel(division);

  return getPageMetadata(
    {
      title: `${year} ${titleWeek} ${divisionName} Top 25 Rankings`,
      description: `Discover the ${year} ${titleWeek} ${divisionName} Top 25 rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
      slug: `/college/${sport}/rankings/${division}/${year}/${week}`,
    },
    perspective,
  );
}

export default function CollegeFootballRankingsPage({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}) {
  return draftAwareParamsPage(params, <RankingsPageSkeleton />, (resolved) =>
    renderCollegeFootballRankingsPage(resolved),
  );
}

async function renderCollegeFootballRankingsPage({
  division,
  year,
  week,
  sport,
}: {
  sport: string;
  division: string;
  year: string;
  week: string;
}) {
  "use cache";

  const yearNumber = resolveYearNumber(year);
  const weekNumber = resolveWeekNumber(week);
  const titleWeek = weekTitle(weekNumber);
  const weekSegment = formatWeekSegment(weekNumber);
  const sportParam = sport as SportParam;
  const divisionName = pollDivisionLabel(division);

  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sportParam),
    rankingsDivisionTag(sportParam, division),
    rankingsWeekTag(sportParam, division, yearNumber, weekNumber),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const [yearsWithVotesResult, weeksWithVotesResult] =
    await Promise.allSettled([
      getCachedYearsThatHaveVotes({ division }),
      getCachedWeeksThatHaveVotes({ year: yearNumber, division }),
    ]);

  const yearsWithVotes =
    yearsWithVotesResult.status === "fulfilled"
      ? yearsWithVotesResult.value
      : [];
  const weeksWithVotes =
    weeksWithVotesResult.status === "fulfilled"
      ? weeksWithVotesResult.value
      : [];

  if (!yearsWithVotes.length || !weeksWithVotes.length) {
    notFound();
  }

  const previousWeek = getPreviousWeek(weeksWithVotes, weekNumber);

  const [finalRankingsResult, previousRankingsResult, ballotContext] =
    await Promise.allSettled([
      getCachedFinalRankings({
        year: yearNumber,
        week: weekNumber,
        division,
        sport: sportParam,
      }),
      previousWeek != null
        ? getCachedFinalRankings({
            year: yearNumber,
            week: previousWeek,
            division,
            sport: sportParam,
          })
        : Promise.resolve(null),
      getCachedPollWeekBallotContext({
        year: yearNumber,
        week: weekNumber,
        division,
        sport: sportParam,
      }),
    ]);

  if (finalRankingsResult.status === "rejected") {
    notFound();
  }

  const { rankings } = finalRankingsResult.value;
  const previousRankings =
    previousRankingsResult.status === "fulfilled" &&
    previousRankingsResult.value != null
      ? previousRankingsResult.value.rankings
      : null;

  const previousRankById = previousRankings
    ? buildRankBySchoolId(previousRankings)
    : null;

  const ballotsCounted =
    ballotContext.status === "fulfilled" && ballotContext.value
      ? ballotContext.value.ballotsCounted
      : 0;
  const ballotsListedBySanityId =
    ballotContext.status === "fulfilled" && ballotContext.value
      ? ballotContext.value.ballotsListedBySanityId
      : {};
  const voterChips =
    ballotContext.status === "fulfilled" && ballotContext.value
      ? ballotContext.value.voterChips
      : [];

  const top25 = rankings.filter((team) => team.rank && team.rank <= TOP_25);
  const outsideTop25 = [...rankings]
    .filter((team) => !team.rank || team.rank > TOP_25)
    .sort((a, b) => b._points - a._points);
  const currentRankingsById = new Map(rankings.map((team) => [team._id, team]));

  const droppedOutOfTop25 = previousRankings
    ? getDroppedOutOfTop25(previousRankings, rankings)
    : [];
  const droppedOutIds = new Set(droppedOutOfTop25.map((t) => t._id));
  const noLongerReceivingVotes = previousRankings
    ? getDroppedFromVotes(previousRankings, rankings).filter(
        (t) => !droppedOutIds.has(t._id),
      )
    : [];

  const pollTableTeams: PollTableTeam[] = top25.map((team) => {
    const prev = previousRankById?.get(team._id) ?? null;
    const prevTop25 =
      typeof prev === "number" && prev > 0 && prev <= TOP_25 ? prev : null;
    return {
      ...team,
      movement: previousRankById
        ? getMovement(team.rank, prev)
        : null,
      ballotsListed: ballotsListedBySanityId[team._id] ?? 0,
      previousRank: prevTop25,
    };
  });

  const biggestMovers = getBiggestMovers(top25, previousRankById);
  const previousWeekTitle =
    previousWeek != null ? weekTitle(previousWeek) : null;
  const moversSubtitle =
    previousWeekTitle != null
      ? `${titleWeek} vs ${previousWeekTitle}`
      : titleWeek;

  const weekPath = `/college/${sport}/rankings/${division}/${year}/${weekSegment}`;
  const ballotsHref = `${weekPath}/ballots`;
  const byVoterHref = `${ballotsHref}/by-voter`;
  const methodologyHref = rankingsMethodologyHref(sport, division);
  const voterWord = ballotsCounted === 1 ? "voter" : "voters";
  const ballotWord = ballotsCounted === 1 ? "ballot" : "ballots";

  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${baseUrl}${weekPath}#webpage`,
        url: `${baseUrl}${weekPath}`,
        name: `${year} ${titleWeek} ${divisionName} Top 25 Rankings | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${year} ${titleWeek} ${divisionName} Top 25 rankings presented by Redshirt Sports.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": websiteId,
        },
        inLanguage: "en-US",
        mainEntity: {
          "@id": `${baseUrl}${weekPath}#rankings`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${baseUrl}${weekPath}#rankings`,
        url: `${baseUrl}${weekPath}`,
        numberOfItems: top25.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: top25.map((team) => ({
          "@type": "ListItem" as const,
          position: team.rank as number,
          item: {
            "@type": "SportsTeam" as const,
            name: team.shortName,
            sport: sport,
          },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLdScript
        data={jsonLd}
        id={`json-ld-${sport}-${division}-${year}-${week}`}
      />
      {ballotsCounted > 0 ? (
        <p className="pt-4 text-sm text-muted-foreground">
          {ballotsCounted} {voterWord} · {ballotsCounted} {ballotWord} counted
        </p>
      ) : null}

      {top25.length > 0 ? (
        <>
          <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid content-start gap-4">
              <RankingsBallotsCta
                variant="mobile"
                ballotsHref={ballotsHref}
                byVoterHref={byVoterHref}
                ballotsCounted={ballotsCounted}
                voterChips={voterChips}
                weekLabel={titleWeek}
              />
              <RankingsPollTable
                teams={pollTableTeams}
                ballotsCounted={ballotsCounted}
                methodologyHref={methodologyHref}
              />
              <RankingsMovementLegend />
            </div>
            <aside className="grid content-start gap-6">
              <RankingsBallotsCta
                variant="desktop"
                ballotsHref={ballotsHref}
                byVoterHref={byVoterHref}
                ballotsCounted={ballotsCounted}
                voterChips={voterChips}
                weekLabel={titleWeek}
              />
              <RankingsBiggestMovers
                movers={biggestMovers}
                weekComparisonLabel={moversSubtitle}
              />
              <AdSlot
                width={300}
                height={250}
                className="mx-auto hidden lg:flex"
              />
            </aside>
          </div>
          <RankingsBeyondTop25
            othersReceivingVotes={outsideTop25}
            droppedOut={droppedOutOfTop25}
            noLongerReceivingVotes={noLongerReceivingVotes}
            ballotsCounted={ballotsCounted}
            currentRankingsById={currentRankingsById}
            ballotsListedBySanityId={ballotsListedBySanityId}
          />
        </>
      ) : (
        <div className="mx-auto max-w-md py-16 text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Top 25 Poll Not Found
          </h2>
          <p className="text-muted-foreground mt-4">
            We&apos;re sorry, but the selected Top 25 poll could not be found.
            Please try again or check back later.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Go back Home
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
