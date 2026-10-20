import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { sportInfoBySlug } from "@redshirt-sports/sanity/queries";
import { notFound } from "next/navigation";

import { buildRankingsTabs, rankingsMethodologyHref } from "@/lib/rankings-nav";
import {
  resolveRankingsWeek,
  resolveRankingsYear,
} from "@/lib/rankings-params";
import {
  getCachedLatestFinalRankingsBySportSlug,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
} from "@/lib/rankings-data";
import { pollDivisionLabel } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { sportNavLabel } from "@/lib/sport-nav";
import type { SportParam } from "@/utils/espn";
import { weekTitle } from "@/utils/espn";

export async function loadRankingsWeekShell({
  sport,
  division,
  year,
  week,
}: {
  sport: string;
  division: string;
  year: string;
  week: string;
}) {
  const yearNumber = resolveRankingsYear(year);
  const weekNumber = resolveRankingsWeek(week);
  const weekSegment = formatWeekSegment(weekNumber);
  const titleWeek = weekTitle(weekNumber);
  const sportParam = sport as SportParam;
  const divisionName = pollDivisionLabel(division);
  const rankingsIndexHref = `/college/${sport}/rankings`;
  const methodologyHref = rankingsMethodologyHref(sport, division);

  const [yearsWithVotes, weeksWithVotes, sportMeta] = await Promise.all([
    getCachedYearsThatHaveVotes({ division }),
    getCachedWeeksThatHaveVotes({ year: yearNumber, division }),
    sanityFetchPage({
      query: sportInfoBySlug,
      params: { slug: sportParam },
      perspective: "published",
      stega: false,
    }),
  ]);

  if (!yearsWithVotes.length || !weeksWithVotes.length) {
    notFound();
  }

  const sportTitle = sportMeta.data?.title as string | undefined;
  const sportLabel = sportNavLabel(sportParam, sportTitle ?? sport);

  const tabs = buildRankingsTabs({
    sport,
    division,
    year,
    weekSegment,
  });

  const weekPath = `/college/${sport}/rankings/${division}/${year}/${weekSegment}`;

  return {
    yearNumber,
    weekNumber,
    weekSegment,
    titleWeek,
    sportParam,
    divisionName,
    sportLabel,
    yearsWithVotes,
    weeksWithVotes,
    tabs,
    weekPath,
    rankingsIndexHref,
    methodologyHref,
    ballotsHref: `${weekPath}/ballots`,
    byVoterHref: `${weekPath}/ballots/by-voter`,
  };
}

export async function loadRankingsDivisionShell({
  sport,
  division,
}: {
  sport: string;
  division: string;
}) {
  const sportParam = sport as SportParam;
  const divisions = await getCachedLatestFinalRankingsBySportSlug(sportParam);
  const match =
    divisions.find((entry) => entry.division === division) ?? divisions[0];
  if (!match) {
    notFound();
  }
  const year = String(match.year);
  const weekSegment = formatWeekSegment(match.week);
  return loadRankingsWeekShell({
    sport,
    division,
    year,
    week: weekSegment,
  });
}
