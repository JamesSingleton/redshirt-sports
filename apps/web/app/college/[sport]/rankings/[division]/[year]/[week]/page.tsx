import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Metadata, Route } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Graph } from "schema-dts";

import BreadCrumbs from "@/components/breadcrumbs";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import { RankingsFilters } from "@/components/rankings/filters";
import { RankMovement } from "@/components/rankings/rank-movement";
import RankingsPageSkeleton from "@/components/rankings/rankings-page-skeleton";
import { RankingsVoterBreakdown } from "@/components/rankings/rankings-voter-breakdown";
import { TeamPageLink } from "@/components/rankings/team-page-link";
import { VoterBreakdownSkeleton } from "@/components/rankings/voter-breakdown-skeleton";
import CustomImage from "@/components/sanity-image";
import { SidebarCard } from "@/components/sidebar-card";
import { SuspenseReveal } from "@/components/suspense-reveal";
import { TOP_25 } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { pollDateLabel } from "@/lib/poll-label";
import {
  getCachedFinalRankings,
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
  displayName,
  getDroppedFromVotes,
  getDroppedOutOfTop25,
  getMovement,
  getPreviousWeek,
  getWeekHighlights,
} from "@/lib/rankings-movement";
import { parseWeekSegment, type SportParam, weekTitle } from "@/utils/espn";

const baseUrl = getBaseUrl();

type RankedTeam = Awaited<
  ReturnType<typeof getCachedFinalRankings>
>["rankings"][number];

function HighlightRow({
  label,
  team,
  detail,
}: {
  label: string;
  team: RankedTeam;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CustomImage
        image={team.image as Parameters<typeof CustomImage>[0]["image"]}
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
        mode="contain"
      />
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs font-medium">
          {label}
        </span>
        <TeamPageLink
          slug={team.slug}
          className="truncate text-sm font-semibold hover:underline"
        >
          {displayName(team)}
        </TeamPageLink>
        <span className="text-muted-foreground text-xs tabular-nums">
          {detail}
        </span>
      </div>
    </li>
  );
}

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

  return getPageMetadata(
    {
      title: `${year} ${titleWeek} ${division.toUpperCase()} Top 25 Rankings`,
      description: `Discover the ${year} ${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
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
  const sportParam = sport as SportParam;

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

  const [finalRankingsResult, previousRankingsResult] =
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
    ]);

  if (finalRankingsResult.status === "rejected") {
    notFound();
  }

  const { rankings, throughDate } = finalRankingsResult.value;
  const previousRankings =
    previousRankingsResult.status === "fulfilled" &&
    previousRankingsResult.value != null
      ? previousRankingsResult.value.rankings
      : null;

  const previousRankById = previousRankings
    ? buildRankBySchoolId(previousRankings)
    : null;

  const top25 = rankings.filter((team) => team.rank && team.rank <= TOP_25);
  const [leader] = top25;
  const outsideTop25 = rankings.filter(
    (team) => !team.rank || team.rank > TOP_25,
  );

  const droppedOutOfTop25 = previousRankings
    ? getDroppedOutOfTop25(previousRankings, rankings)
    : [];
  const droppedOutIds = new Set(droppedOutOfTop25.map((t) => t._id));
  const noLongerReceivingVotes = previousRankings
    ? getDroppedFromVotes(previousRankings, rankings).filter(
        (t) => !droppedOutIds.has(t._id),
      )
    : [];

  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#webpage`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
        name: `${year} ${titleWeek} ${division.toUpperCase()} Top 25 Rankings | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        description: `Discover the ${year} ${titleWeek} ${division.toUpperCase()} Top 25 College Football Rankings presented by Redshirt Sports. See how the voters ranked the top teams.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": websiteId,
        },
        inLanguage: "en-US",
        mainEntity: {
          "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}#rankings`,
        url: `${baseUrl}/college/${sport}/rankings/${division}/${year}/${week}`,
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

  const divisionLabel = division.toUpperCase();
  const otherLists = [
    {
      key: "others",
      title: "Others receiving votes",
      teams: outsideTop25.map((team) => ({
        _id: team._id,
        slug: team.slug,
        label: team.shortName ?? displayName(team),
        detail: String(team._points),
      })),
    },
    {
      key: "dropped",
      title: "Dropped out",
      teams: droppedOutOfTop25.map((team) => ({
        _id: team._id,
        slug: team.slug,
        label: displayName(team),
        detail: `(was No. ${team.previousRank})`,
      })),
    },
    {
      key: "no-votes",
      title: "No longer receiving votes",
      teams: noLongerReceivingVotes.map((team) => ({
        _id: team._id,
        slug: team.slug,
        label: displayName(team),
        detail: null,
      })),
    },
  ].filter((list) => list.teams.length > 0);

  const highlights = previousRankById
    ? getWeekHighlights(top25, previousRankById)
    : null;

  return (
    <div className="container flex flex-col gap-8 py-6 md:py-10">
      <JsonLdScript
        data={jsonLd}
        id={`json-ld-${sport}-${division}-${year}-${week}`}
      />
      <div className="flex flex-col gap-4">
        <BreadCrumbs
          breadCrumbPages={[
            { title: "Rankings", href: `/college/${sport}/rankings` },
            {
              title: `${divisionLabel} Top 25`,
              href: `/college/${sport}/rankings/${division}/${year}/${week}`,
            },
          ]}
        />
        <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-brand text-sm font-semibold">
              {pollDateLabel({
                week: weekNumber,
                year: yearNumber,
                throughDate,
              })}
            </p>
            <h1 className="headline text-4xl text-balance md:text-5xl">
              {divisionLabel} Top 25
            </h1>
            <p className="text-muted-foreground text-pretty">
              Our {divisionLabel} Top 25 uses a point system: 25 points for a
              first-place vote down to 1 point for a 25th-place vote. Total
              points determine the final rankings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RankingsFilters
              years={yearsWithVotes}
              weeks={weeksWithVotes}
              currentYear={year}
              currentWeek={week}
            />
          </div>
        </header>
      </div>

      {leader ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section
            aria-label={`${divisionLabel} Top 25 poll`}
            className="bg-card overflow-hidden rounded-md border lg:col-span-8"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 pl-4">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="w-16">Trend</TableHead>
                  <TableHead className="w-20 pr-4 text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((team) => {
                  const movement = previousRankById
                    ? getMovement(team.rank, previousRankById.get(team._id))
                    : null;

                  return (
                    <TableRow key={team._id}>
                      <TableCell className="pl-4">
                        <span
                          className={cn(
                            "rank-numeral text-2xl",
                            team.rank === 1 && "text-brand",
                          )}
                        >
                          {team.isTie ? `T${team.rank}` : team.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CustomImage
                            image={
                              team.image as Parameters<
                                typeof CustomImage
                              >[0]["image"]
                            }
                            width={36}
                            height={36}
                            className="size-9 shrink-0 object-contain"
                            mode="contain"
                          />
                          <TeamPageLink
                            slug={team.slug}
                            className="font-semibold hover:underline"
                          >
                            {team.shortName ?? team.abbreviation ?? team.name}
                          </TeamPageLink>
                          {team.firstPlaceVotes ? (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              ({team.firstPlaceVotes})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement ? <RankMovement movement={movement} /> : null}
                      </TableCell>
                      <TableCell className="pr-4 text-right font-semibold tabular-nums">
                        {team._points}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {otherLists.length > 0 ? (
              <dl className="flex flex-col gap-3 border-t px-4 py-4 text-sm">
                {otherLists.map((list) => (
                  <div key={list.key} className="text-pretty">
                    <dt className="inline font-semibold">{list.title}: </dt>
                    <dd className="text-muted-foreground inline">
                      {list.teams.map((team, index) => (
                        <span key={team._id}>
                          <TeamPageLink
                            slug={team.slug}
                            className="text-foreground hover:underline"
                          >
                            {team.label}
                          </TeamPageLink>
                          {team.detail ? (
                            <span className="tabular-nums"> {team.detail}</span>
                          ) : null}
                          {index < list.teams.length - 1 ? ", " : null}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <SidebarCard.Root labelledBy="week-highlights-heading">
                <SidebarCard.Header
                  id="week-highlights-heading"
                  title="This week"
                />
                <ul className="divide-y">
                  <HighlightRow
                    label="No. 1"
                    team={leader}
                    detail={
                      leader.firstPlaceVotes
                        ? `${leader.firstPlaceVotes} first-place votes`
                        : `${leader._points} points`
                    }
                  />
                  {highlights?.riser ? (
                    <HighlightRow
                      label="Biggest riser"
                      team={highlights.riser.team}
                      detail={`Up ${highlights.riser.delta} to No. ${highlights.riser.team.rank}`}
                    />
                  ) : null}
                  {highlights?.faller ? (
                    <HighlightRow
                      label="Biggest fall"
                      team={highlights.faller.team}
                      detail={`Down ${highlights.faller.delta} to No. ${highlights.faller.team.rank}`}
                    />
                  ) : null}
                  {highlights?.newcomers.length ? (
                    <li className="flex flex-col gap-1 px-4 py-3 text-sm">
                      <span className="text-muted-foreground text-xs font-medium">
                        New to the Top 25
                      </span>
                      <span className="text-pretty">
                        {highlights.newcomers.map((team, index) => (
                          <span key={team._id}>
                            <TeamPageLink
                              slug={team.slug}
                              className="font-semibold hover:underline"
                            >
                              {displayName(team)}
                            </TeamPageLink>
                            <span className="text-muted-foreground tabular-nums">
                              {" "}
                              No. {team.rank}
                            </span>
                            {index < highlights.newcomers.length - 1
                              ? ", "
                              : null}
                          </span>
                        ))}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </SidebarCard.Root>
            </div>
          </aside>
        </div>
      ) : (
        <Empty className="bg-card rounded-md border">
          <EmptyHeader>
            <EmptyTitle>No poll for this week</EmptyTitle>
            <EmptyDescription>
              The selected Top 25 poll could not be found. Pick another week or
              check back later.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href={`/college/${sport}/rankings` as Route}
              className={buttonVariants()}
              prefetch={false}
            >
              Latest polls
            </Link>
          </EmptyContent>
        </Empty>
      )}

      {top25.length > 0 ? (
        <SuspenseReveal fallback={<VoterBreakdownSkeleton />}>
          <RankingsVoterBreakdown
            division={division}
            year={yearNumber}
            week={weekNumber}
            sport={sportParam}
            consensusRanks={top25.map((team) => ({
              id: team._id,
              rank: team.rank as number,
            }))}
          />
        </SuspenseReveal>
      ) : null}
    </div>
  );
}
