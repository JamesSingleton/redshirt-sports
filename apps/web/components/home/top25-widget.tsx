"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@redshirt-sports/ui/components/tabs";
import Link from "next/link";
import { useState } from "react";

import {
  buildRankingHref,
  getDivisionDisplayName,
} from "@/components/nav-config";
import CustomImage from "@/components/sanity-image";
import type { HomePollData } from "@/lib/home-rankings";

interface Top25WidgetProps {
  sportSlug: string;
  polls: Record<string, HomePollData | null>;
  pinnedDivision?: string;
  tabOrder?: string[];
}

function PollList({ poll }: { poll: HomePollData }) {
  return (
    <ol>
      {poll.teams.map((team) => (
        <li
          key={team._id}
          className="flex items-center gap-3 border-border border-t px-4 py-2.5 transition-colors hover:bg-muted/50"
        >
          <span className="w-5 shrink-0 text-right text-xs font-black text-muted-foreground tabular-nums">
            {team.rank}
          </span>
          <div className="flex size-7 shrink-0 items-center justify-center">
            <CustomImage
              image={team.image}
              width={28}
              height={28}
              className="object-contain"
              mode="contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight font-semibold text-foreground">
              {team.shortName || team.name}
              {team.firstPlaceVotes ? (
                <span className="ml-1 font-medium text-muted-foreground">
                  ({team.firstPlaceVotes})
                </span>
              ) : null}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function getAvailablePollKeys(
  polls: Record<string, HomePollData | null>,
  tabOrder?: string[],
): string[] {
  const available = Object.entries(polls)
    .filter((entry): entry is [string, HomePollData] => entry[1] != null)
    .map(([key]) => key);

  if (tabOrder?.length) {
    return tabOrder.filter((key) => polls[key] != null);
  }

  return available;
}

function getTabbedWidgetTitle(sportSlug: string): string {
  switch (sportSlug) {
    case "football":
      return "Top 25 College Football Polls";
    case "mens-basketball":
      return "Top 25 Men's Basketball Poll";
    case "womens-basketball":
      return "Top 25 Women's Basketball Poll";
    default:
      return "Top 25 Poll";
  }
}

function getPinnedWidgetTitle(division: string): string {
  return `Top 25 ${getDivisionDisplayName(division)} Poll`;
}

export function Top25Widget({
  sportSlug,
  polls,
  pinnedDivision,
  tabOrder,
}: Top25WidgetProps) {
  const availablePolls = getAvailablePollKeys(polls, tabOrder);

  const [activePoll, setActivePoll] = useState(
    pinnedDivision ?? availablePolls[0] ?? "",
  );

  if (availablePolls.length === 0) {
    return null;
  }

  if (pinnedDivision) {
    const poll = polls[pinnedDivision];
    if (!poll) {
      return null;
    }

    const rankingsHref = buildRankingHref(sportSlug, {
      division: poll.division,
      year: poll.year,
      week: poll.week,
    });

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-black tracking-tight text-foreground uppercase">
              {getPinnedWidgetTitle(pinnedDivision)}
            </CardTitle>
            <Link
              href={rankingsHref}
              prefetch={false}
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Full Rankings →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <PollList poll={poll} />
        </CardContent>
      </Card>
    );
  }

  const activeData = polls[activePoll];
  const rankingsHref = activeData
    ? buildRankingHref(sportSlug, {
        division: activeData.division,
        year: activeData.year,
        week: activeData.week,
      })
    : `/college/${sportSlug}/news`;

  return (
    <Tabs
      value={activePoll}
      onValueChange={setActivePoll}
      className="gap-0"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black tracking-tight text-foreground uppercase">
              {getTabbedWidgetTitle(sportSlug)}
            </CardTitle>
            <Link
              href={rankingsHref}
              prefetch={false}
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Full Rankings →
            </Link>
          </div>
          {availablePolls.length > 1 ? (
            <TabsList variant="line" className="w-full">
              {availablePolls.map((division) => (
                <TabsTrigger
                  key={division}
                  value={division}
                  className="flex-1 uppercase"
                >
                  {getDivisionDisplayName(division)}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : null}
        </CardHeader>
        <CardContent>
          {availablePolls.map((division) => {
            const poll = polls[division];
            if (!poll) {
              return null;
            }

            return (
              <TabsContent key={division} value={division} className="mt-0">
                <PollList poll={poll} />
              </TabsContent>
            );
          })}
        </CardContent>
      </Card>
    </Tabs>
  );
}
