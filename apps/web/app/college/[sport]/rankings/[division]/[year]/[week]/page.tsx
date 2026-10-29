import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RankingsWeekPageBody } from "@/components/rankings/rankings-week-page-body";
import { loadAdvertisement } from "@/lib/advertisement";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import {
  loadRankingsWeekPageModel,
  pollDivisionLabel,
} from "@/lib/rankings/read-model";
import { sportNavLabel } from "@/lib/sport-nav";
import { parseWeekSegment, weekTitle } from "@/utils/espn";

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
  const sportLabel = sportNavLabel(sport, sport);

  return getPageMetadata(
    {
      title: `${year} ${titleWeek} ${divisionName} ${sportLabel} Top 25 Rankings`,
      description: `Discover the ${year} ${titleWeek} ${divisionName} ${sportLabel} Top 25 rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
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
  return draftAwareParamsPage(params, null, (resolved, options) =>
    renderCollegeFootballRankingsPage(resolved, options),
  );
}

async function renderCollegeFootballRankingsPage(
  {
    division,
    year,
    week,
    sport,
  }: {
    sport: string;
    division: string;
    year: string;
    week: string;
  },
  fetchOptions: DynamicFetchOptions = PUBLISHED_FETCH_OPTIONS,
) {
  "use cache";
  const model = await loadRankingsWeekPageModel({
    sport,
    division,
    year,
    week,
  });
  const advertisement = await loadAdvertisement({
    placement: "rankings-week-sidebar",
    sportSlugs: [sport],
    fetchOptions,
  });
  return <RankingsWeekPageBody model={model} advertisement={advertisement} />;
}
