import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedLatestPollWeek } from "@/lib/rankings-data";
import type { SportParam } from "@/utils/espn";
import WeekRankingsPage from "./[year]/[week]/page";

type Params = { sport: string; division: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const label = division.toUpperCase();

  return getPageMetadata(
    {
      title: `${label} Top 25 College Football Rankings`,
      description: `The latest Redshirt Sports ${label} Top 25 college football poll. See where every team ranks this week and how the voters saw it.`,
      slug: `/college/${sport}/rankings/${division}`,
    },
    PUBLISHED_FETCH_OPTIONS.perspective,
  );
}

/** Stable URL that always renders the most recent published poll. */
export default function LatestRankingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const weekParams = params.then(async ({ sport, division }) => {
    const latest = await getCachedLatestPollWeek({
      sport: sport as SportParam,
      division,
    });
    if (!latest) {
      notFound();
    }
    return {
      sport,
      division,
      year: String(latest.year),
      week: formatWeekSegment(latest.week),
    };
  });

  return <WeekRankingsPage params={weekParams} />;
}
