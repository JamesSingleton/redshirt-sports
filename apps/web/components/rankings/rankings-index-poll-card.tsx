import { Badge } from "@redshirt-sports/ui/components/badge";
import { Card } from "@redshirt-sports/ui/components/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { RankMovement } from "@/components/rankings/rank-movement";
import { TeamMark } from "@/components/rankings/team-mark";
import type { RankingsIndexCard } from "@/lib/rankings-widget-data";
import { NAV_FORWARD_TRANSITION } from "@/lib/view-transition-nav";

export function RankingsIndexPollCard({ card }: { card: RankingsIndexCard }) {
  const { poll, teams, sport } = card;
  const votersHref = `/college/${sport}/rankings/${poll.division}/voters`;
  const historyHref = `/college/${sport}/rankings/${poll.division}/history`;

  return (
    <Card className="gap-0 p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="kicker text-primary">
            Redshirt Sports Poll · {card.label}
          </div>
          <h2 className="font-display text-3xl font-extrabold uppercase leading-none">
            <Link
              href={poll.weekHref}
              className="hover:underline"
              prefetch={true}
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              {card.title}
            </Link>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Week {poll.week} · {poll.year}
          </p>
        </div>
        <Badge className="border-up/30 bg-up/15 text-up">Live</Badge>
      </div>
      <ol className="mt-4">
        {teams.map((team) => (
          <li
            key={team._id}
            className="flex items-center gap-3 border-b py-2 text-sm last:border-0"
          >
            <span className="w-6 text-right font-display text-lg font-bold tabular-nums">
              {team.rank}
            </span>
            <TeamMark
              image={team.image}
              shortName={team.shortName}
              abbreviation={team.abbreviation}
            />
            <span className="flex-1 truncate font-medium">
              {team.shortName}
            </span>
            <span className="w-9 text-right">
              {team.movement ? (
                <RankMovement movement={team.movement} />
              ) : (
                <span className="text-muted-foreground" aria-label="No change">
                  —
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        <Link
          href={poll.weekHref}
          prefetch={true}
          transitionTypes={[...NAV_FORWARD_TRANSITION]}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          Full Top 25
          <ChevronRight className="size-4" aria-hidden />
        </Link>
        <span className="text-xs text-muted-foreground">
          <Link
            href={poll.ballotsHref}
            className="hover:text-foreground"
            prefetch={false}
          >
            Ballots
          </Link>
          {" · "}
          <Link
            href={votersHref}
            className="hover:text-foreground"
            prefetch={false}
          >
            Voters
          </Link>
          {" · "}
          <Link
            href={historyHref}
            className="hover:text-foreground"
            prefetch={false}
          >
            History
          </Link>
        </span>
      </div>
    </Card>
  );
}
