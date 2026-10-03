import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { TabsList, TabsTrigger } from "@redshirt-sports/ui/components/tabs";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  TransitionTabs,
  TransitionTabsPanel,
} from "@/components/rankings/transition-tabs";
import CustomImage from "@/components/sanity-image";
import { SidebarCard } from "@/components/sidebar-card";
import { TOP_25 } from "@/lib/constants";
import { getCachedLatestPoll, type LatestPoll } from "@/lib/rankings-data";
import { weekTitle } from "@/utils/espn";

type TeamImage = Parameters<typeof CustomImage>[0]["image"];

/** Ordered by readership: FCS first. */
export const FOOTBALL_POLL_DIVISIONS = [
  { slug: "fcs", label: "FCS" },
  { slug: "fbs", label: "FBS" },
  { slug: "d2", label: "D-II" },
  { slug: "d3", label: "D-III" },
] as const;

type PollDivision = (typeof FOOTBALL_POLL_DIVISIONS)[number]["slug"];

const ROWS = 10;

function PollRows({ poll }: { poll: LatestPoll }) {
  const teams = poll.rankings
    .filter((team) => team.rank !== null && team.rank <= TOP_25)
    .slice(0, ROWS);

  return (
    <ol>
      {teams.map((team) => {
        const row = (
          <>
            <span className="rank-numeral text-muted-foreground group-first:text-brand w-6 shrink-0 text-right text-xl">
              {team.rank}
            </span>
            <span className="flex size-7 shrink-0 items-center justify-center">
              {team.image ? (
                <CustomImage
                  image={team.image as TeamImage}
                  width={28}
                  height={28}
                  mode="contain"
                  className="size-7 object-contain"
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {team.shortName || team.name}
              {team.firstPlaceVotes ? (
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  ({team.firstPlaceVotes})
                </span>
              ) : null}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {team._points}
            </span>
          </>
        );

        return (
          <li key={team._id || team.name} className="group border-t">
            {team.slug ? (
              <Link
                href={`/college/teams/${team.slug}` as Route}
                className="hover:bg-muted flex items-center gap-3 px-4 py-2 transition-colors"
              >
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2">{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PollFooter({
  division,
  label,
  poll,
}: {
  division: PollDivision;
  label: string;
  poll: LatestPoll;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
      <span className="text-muted-foreground text-xs">
        {weekTitle(poll.week)}, {poll.year}
      </span>
      <Link
        href={`/college/football/rankings/${division}` as Route}
        className="text-primary text-sm font-semibold hover:underline hover:underline-offset-4"
      >
        Full {label} rankings
      </Link>
    </div>
  );
}

async function getAvailablePolls(divisions: readonly PollDivision[]) {
  const polls = await Promise.all(
    FOOTBALL_POLL_DIVISIONS.filter((entry) =>
      divisions.includes(entry.slug),
    ).map(async (entry) => ({
      ...entry,
      poll: await getCachedLatestPoll({
        sport: "football",
        division: entry.slug,
      }),
    })),
  );
  return polls.filter(
    (entry): entry is typeof entry & { poll: LatestPoll } =>
      entry.poll !== null,
  );
}

/** Latest Redshirt Sports Top 25, one tab per football division with a poll. */
export async function Top25Card() {
  const available = await getAvailablePolls(
    FOOTBALL_POLL_DIVISIONS.map((entry) => entry.slug),
  );
  const first = available[0];
  if (!first) return null;

  return (
    <SidebarCard.Root labelledBy="top25-card-heading">
      <TransitionTabs defaultValue={first.slug} className="gap-0">
        <SidebarCard.Header id="top25-card-heading" title="Top 25 polls">
          {available.length > 1 ? (
            <TabsList variant="line" className="w-full justify-start">
              {available.map((entry) => (
                <TabsTrigger key={entry.slug} value={entry.slug}>
                  {entry.label}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : null}
        </SidebarCard.Header>
        {available.map((entry) => (
          <TransitionTabsPanel key={entry.slug} value={entry.slug}>
            <PollRows poll={entry.poll} />
            <PollFooter
              division={entry.slug}
              label={entry.label}
              poll={entry.poll}
            />
          </TransitionTabsPanel>
        ))}
      </TransitionTabs>
    </SidebarCard.Root>
  );
}

/** A single division's latest poll, for division and team pages. */
export async function DivisionTop25Card({
  division,
}: {
  division: PollDivision;
}) {
  const [entry] = await getAvailablePolls([division]);
  if (!entry) return null;

  return (
    <SidebarCard.Root labelledBy={`top25-${division}-heading`}>
      <SidebarCard.Header
        id={`top25-${division}-heading`}
        title={`${entry.label} Top 25`}
      />
      <PollRows poll={entry.poll} />
      <PollFooter division={division} label={entry.label} poll={entry.poll} />
    </SidebarCard.Root>
  );
}

export function isPollDivision(value: string): value is PollDivision {
  return FOOTBALL_POLL_DIVISIONS.some((entry) => entry.slug === value);
}

function PollCardSkeletonFrame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="bg-card overflow-hidden rounded-md border"
    >
      {children}
    </div>
  );
}

function PollHeaderSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="border-brand flex flex-col gap-3 border-l-4 px-4 py-3">
      <Skeleton className="h-5 w-32" />
      {children}
    </div>
  );
}

function PollRowsSkeleton() {
  return (
    <>
      {Array.from({ length: ROWS }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-t px-4 py-2">
          <Skeleton className="h-5 w-6" />
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </>
  );
}

/** Fallback for {@link Top25Card}. */
export function Top25CardSkeleton() {
  return (
    <PollCardSkeletonFrame>
      <PollHeaderSkeleton>
        <div className="flex gap-4">
          {FOOTBALL_POLL_DIVISIONS.map((entry) => (
            <Skeleton key={entry.slug} className="h-7 w-10" />
          ))}
        </div>
      </PollHeaderSkeleton>
      <PollRowsSkeleton />
    </PollCardSkeletonFrame>
  );
}

/** Fallback for {@link DivisionTop25Card}. */
export function DivisionTop25CardSkeleton() {
  return (
    <PollCardSkeletonFrame>
      <PollHeaderSkeleton />
      <PollRowsSkeleton />
    </PollCardSkeletonFrame>
  );
}
