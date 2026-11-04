import { formatWeekSegment, weekTitle } from "@redshirt-sports/clients/espn";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
} from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RankingsLatestPollContext } from "@/components/rankings/rankings-poll-context";
import RankingsTabSkeleton from "@/components/rankings/rankings-tab-skeleton";
import { RankingsWeekChrome } from "@/components/rankings/rankings-week-chrome";
import { RankingsWeekPageBody } from "@/components/rankings/rankings-week-page-body";
import { loadAdvertisement } from "@/lib/advertisement";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { latestPollPageTitle } from "@/lib/rankings/page-titles";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import {
  loadRankingsWeekPageModel,
  pollDivisionLabel,
} from "@/lib/rankings/read-model";
import { getCachedLatestPublishedPoll } from "@/lib/rankings-data";
import { sportNavLabel } from "@/lib/sport-nav";

/**
 * Stable "current poll" URL for a sport's poll. Shows the latest published
 * week (preseason → weekly → final, then the next season's preseason) and
 * 404s until the poll's first week is published, so unlaunched polls are
 * never indexed. Week URLs remain the permanent archive.
 */
async function requireLatestPoll(sport: string, division: string) {
  const latest = await getCachedLatestPublishedPoll({ sport, division });
  if (!latest) {
    notFound();
  }
  return latest;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const { perspective } = await getDynamicFetchOptions();
  const latest = await requireLatestPoll(sport, division);
  const titleWeek = weekTitle(latest.week);
  const divisionName = pollDivisionLabel(division);
  const sportLabel = sportNavLabel(sport, sport);

  return getPageMetadata(
    {
      title: latestPollPageTitle({
        divisionName,
        sportLabel,
        year: latest.year,
        titleWeek,
      }),
      description: `The latest ${divisionName} ${sportLabel} Top 25 from Redshirt Sports: the ${latest.year} ${titleWeek} poll, with every voter's ballot.`,
      slug: pollLatestPath(sport, division),
    },
    perspective,
  );
}

export default function LatestPollPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  return draftAwareParamsPage(
    params,
    <RankingsTabSkeleton variant="poll" />,
    (resolved, options) => renderLatestPollPage(resolved, options),
  );
}

async function renderLatestPollPage(
  { sport, division }: { sport: string; division: string },
  fetchOptions: DynamicFetchOptions = PUBLISHED_FETCH_OPTIONS,
) {
  const latest = await requireLatestPoll(sport, division);
  const year = String(latest.year);
  const weekSegment = formatWeekSegment(latest.week);
  const [model, advertisement] = await Promise.all([
    loadRankingsWeekPageModel({
      sport,
      division,
      year,
      week: weekSegment,
      pagePath: pollLatestPath(sport, division),
    }),
    loadAdvertisement({
      placement: "rankings-week-sidebar",
      sportSlugs: [sport],
      fetchOptions,
    }),
  ]);

  // Same header as week pages (title, methodology, year/week pickers), with
  // the pickers set to the latest week since this URL has no year/week.
  return (
    <>
      <RankingsWeekChrome
        params={Promise.resolve({ sport, division, year, week: weekSegment })}
        pinSelection
      />
      <RankingsWeekPageBody
        model={model}
        advertisement={advertisement}
        context={
          <RankingsLatestPollContext
            sport={sport}
            division={division}
            year={year}
            weekSegment={weekSegment}
            titleWeek={model.titleWeek}
            publishedAt={latest.publishedAt}
          />
        }
      />
    </>
  );
}
