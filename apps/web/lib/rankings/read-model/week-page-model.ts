import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Graph } from "schema-dts";

import { websiteId } from "@/components/json-ld";
import type { PollTableTeam } from "@/components/rankings/rankings-poll-table";
import { TOP_25 } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
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
import {
  buildRankBySchoolId,
  getBiggestMovers,
  getDroppedFromVotes,
  getDroppedOutOfTop25,
  getMovement,
  getPreviousWeek,
} from "@/lib/rankings-movement";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import { sportNavLabel } from "@/lib/sport-nav";
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

export async function loadRankingsWeekPageModel({
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
  const sportLabel = sportNavLabel(sport, sport);

  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sportParam),
    rankingsDivisionTag(sportParam, division),
    rankingsWeekTag(sportParam, division, yearNumber, weekNumber),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const [yearsWithVotesResult, weeksWithVotesResult] = await Promise.allSettled(
    [
      getCachedYearsThatHaveVotes({ division }),
      getCachedWeeksThatHaveVotes({ year: yearNumber, division }),
    ],
  );

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
      movement: previousRankById ? getMovement(team.rank, prev) : null,
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
  const methodologyHref = rankingsMethodologyHref();
  const voterWord = ballotsCounted === 1 ? "voter" : "voters";
  const ballotWord = ballotsCounted === 1 ? "ballot" : "ballots";

  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${baseUrl}${weekPath}#webpage`,
        url: `${baseUrl}${weekPath}`,
        name: `${year} ${titleWeek} ${divisionName} ${sportLabel} Top 25 Rankings | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${year} ${titleWeek} ${divisionName} ${sportLabel} Top 25 rankings presented by Redshirt Sports.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": websiteId,
        },
        inLanguage: "en-US",
        breadcrumb: {
          "@type": "BreadcrumbList",
          "@id": `${baseUrl}${weekPath}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: sportLabel,
              item: `${baseUrl}/college/${sport}/news`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Rankings",
              item: `${baseUrl}/college/${sport}/rankings`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: `${year} ${titleWeek} ${divisionName}`,
              item: `${baseUrl}${weekPath}`,
            },
          ],
        },
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

  return {
    jsonLd,
    ballotsCounted,
    voterWord,
    ballotWord,
    titleWeek,
    top25Count: top25.length,
    pollTableTeams,
    biggestMovers,
    moversSubtitle,
    ballotsHref,
    byVoterHref,
    methodologyHref,
    voterChips,
    outsideTop25,
    droppedOutOfTop25,
    noLongerReceivingVotes,
    currentRankingsById,
    ballotsListedBySanityId,
    sport,
    division,
    year,
    weekSegment,
  };
}

export type RankingsWeekPageModel = Awaited<
  ReturnType<typeof loadRankingsWeekPageModel>
>;
