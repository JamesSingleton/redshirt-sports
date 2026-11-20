"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@redshirt-sports/ui/components/tabs";
import { whenSelected } from "@redshirt-sports/ui/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { RankMovement } from "@/components/rankings/rank-movement";
import { TeamMark } from "@/components/rankings/team-mark";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export function RankingsWidget({ polls }: { polls: RankingsWidgetPoll[] }) {
  const [active, setActive] = useState(polls[0]?.division ?? "");

  const activePoll = useMemo(
    () => polls.find((poll) => poll.division === active) ?? polls[0],
    [active, polls],
  );

  if (!activePoll) {
    return null;
  }

  return (
    <Card data-testid="rankings-widget" className="gap-0 py-0 shadow-xs">
      <CardHeader className="flex items-start justify-between gap-2 px-5 pt-5">
        <div className="grid gap-1">
          <CardTitle className="font-display text-xl font-bold leading-[1.08]">
            {activePoll.label} Top 25
          </CardTitle>
          <CardDescription>
            Week {activePoll.week} · {activePoll.year}
          </CardDescription>
        </div>
        {polls.length > 1 ? (
          <Tabs
            value={active}
            onValueChange={whenSelected((value: string) =>
              setActive(value as typeof active),
            )}
          >
            <TabsList className="h-8 text-sm">
              {polls.map((poll) => (
                <TabsTab key={poll.division} value={poll.division}>
                  {poll.label}
                </TabsTab>
              ))}
            </TabsList>
            {polls.map((poll) => (
              <TabsPanel
                key={poll.division}
                value={poll.division}
                keepMounted
                className="sr-only"
              >
                {poll.label} rankings
              </TabsPanel>
            ))}
          </Tabs>
        ) : null}
      </CardHeader>
      <CardContent className="px-5 pt-2">
        <ol className="divide-y">
          {activePoll.teams.map((team) => (
            <li key={team._id} className="flex items-center gap-3 py-2">
              <span className="w-5 text-right font-display text-lg font-bold tabular">
                {team.rank}
              </span>
              <TeamMark
                image={team.image}
                shortName={team.shortName}
                abbreviation={team.abbreviation}
              />
              <div className="min-w-0 flex-1">
                {team.slug ? (
                  <Link
                    href={`/college/teams/${team.slug}`}
                    className="truncate text-sm font-semibold hover:underline"
                    prefetch={false}
                  >
                    {team.shortName}
                  </Link>
                ) : (
                  <div className="truncate text-sm font-semibold">
                    {team.shortName}
                  </div>
                )}
              </div>
              <span className="w-9 text-right">
                {team.movement ? (
                  <RankMovement movement={team.movement} />
                ) : (
                  <span
                    className="text-muted-foreground"
                    role="img"
                    aria-label="No change"
                  >
                    —
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="flex gap-2 px-5 pt-3 pb-5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          render={<Link href={activePoll.weekHref} prefetch={false} />}
        >
          Full poll
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          render={<Link href={activePoll.ballotsHref} prefetch={false} />}
        >
          <Eye className="size-4" aria-hidden />
          Ballots
        </Button>
      </CardFooter>
    </Card>
  );
}
