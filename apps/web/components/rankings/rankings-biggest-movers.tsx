import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";

import { RankMovement } from "@/components/rankings/rank-movement";
import { TeamMark } from "@/components/rankings/team-mark";
import type { Movement, RankingTeamRef } from "@/lib/rankings-movement";
import { displayName } from "@/lib/rankings-movement";

export function RankingsBiggestMovers({
  movers,
  weekComparisonLabel,
}: {
  movers: Array<{ team: RankingTeamRef; movement: Movement }>;
  weekComparisonLabel: string;
}) {
  if (movers.length === 0) {
    return null;
  }

  return (
    <Card className="gap-0 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-5 pt-5">
        <div className="grid gap-1">
          <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
            Biggest movers
          </CardTitle>
          <CardDescription>{weekComparisonLabel}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-2 pb-4">
        {movers.map(({ team, movement }) => (
          <div
            key={team._id}
            className="flex items-center gap-2 border-b py-2 text-sm last:border-0"
          >
            <TeamMark
              image={team.image}
              shortName={team.shortName}
              abbreviation={team.abbreviation}
              name={team.name}
              size="sm"
            />
            <span className="flex-1 truncate font-medium">
              {displayName(team)}
            </span>
            <RankMovement movement={movement} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
