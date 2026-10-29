import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import Link from "next/link";

import { RankMovement } from "@/components/rankings/rank-movement";
import { TeamMark } from "@/components/rankings/team-mark";
import { TeamPageLink } from "@/components/rankings/team-page-link";
import { TeamHubLogoTransition } from "@/components/view-transitions/team-hub-logo-transition";
import type { Movement, RankingTeamRef } from "@/lib/rankings-movement";
import { displayName } from "@/lib/rankings-movement";

export type PollTableTeam = RankingTeamRef & {
  movement: Movement | null;
  ballotsListed: number;
  previousRank: number | null;
};

function ballotsBarWidth(listed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((listed / total) * 100);
}

function formatPreviousRank(
  movement: Movement | null,
  previousRank: number | null,
): string {
  if (movement?.kind === "nr" || previousRank == null) {
    return "—";
  }
  return String(previousRank);
}

export function RankingsPollTable({
  teams,
  ballotsCounted,
  methodologyHref,
}: {
  teams: PollTableTeam[];
  ballotsCounted: number;
  methodologyHref: string;
}) {
  const ballotWord = ballotsCounted === 1 ? "ballot" : "ballots";

  return (
    <div className="relative w-full min-w-0 overflow-clip rounded-xl border bg-card">
      <Table>
        <TableCaption className="px-4 py-3 text-left text-sm text-muted-foreground">
          {ballotsCounted} voters × 25-to-1 points (max {ballotsCounted * 25}).
          First-place votes in parentheses.{" "}
          <strong className="font-semibold text-foreground">
            On X of {ballotsCounted} {ballotWord}
          </strong>{" "}
          = how many voters ranked the team anywhere from 1 to 25 this week.{" "}
          <Link
            href={methodologyHref}
            prefetch={false}
            className="font-medium text-primary underline underline-offset-2"
          >
            How it works
          </Link>
        </TableCaption>
        <TableHeader>
          <TableRow className="text-left text-sm uppercase tracking-wide text-muted-foreground hover:bg-transparent">
            <TableHead className="h-10 pl-4 text-right">Rk</TableHead>
            <TableHead className="w-12">±</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Pts</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              Prev
            </TableHead>
            <TableHead
              className="hidden pr-4 text-right lg:table-cell"
              title={`Number of the ${ballotsCounted} ballots that ranked this team`}
            >
              On ballots
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const rankLabel = team.isTie ? `T-${team.rank}` : String(team.rank);
            const listed = team.ballotsListed;
            const onBallotsLabel = `On ${listed} of ${ballotsCounted}`;
            const barWidth = ballotsBarWidth(listed, ballotsCounted);
            const fullSupport = listed >= ballotsCounted && ballotsCounted > 0;

            return (
              <TableRow key={team._id} className="hover:bg-muted/50">
                <TableCell className="pl-4 text-right font-display text-xl font-bold tabular-nums">
                  {rankLabel}
                </TableCell>
                <TableCell className="w-12">
                  {team.movement ? (
                    <RankMovement movement={team.movement} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {team.slug ? (
                      <TeamHubLogoTransition slug={team.slug}>
                        <TeamMark
                          image={team.image}
                          shortName={team.shortName}
                          abbreviation={team.abbreviation}
                          name={team.name}
                          size="table"
                        />
                      </TeamHubLogoTransition>
                    ) : (
                      <TeamMark
                        image={team.image}
                        shortName={team.shortName}
                        abbreviation={team.abbreviation}
                        name={team.name}
                        size="table"
                      />
                    )}
                    <div className="min-w-0">
                      <TeamPageLink
                        slug={team.slug}
                        className="font-semibold hover:underline"
                      >
                        {displayName(team)}
                      </TeamPageLink>
                      {team.firstPlaceVotes ? (
                        <span className="text-sm text-muted-foreground">
                          {" "}
                          ({team.firstPlaceVotes})
                        </span>
                      ) : null}
                      <div className="text-sm text-muted-foreground lg:hidden">
                        {onBallotsLabel} {ballotWord}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {team._points}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                  {formatPreviousRank(team.movement, team.previousRank)}
                </TableCell>
                <TableCell className="hidden pr-4 lg:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={
                        fullSupport
                          ? "text-sm font-semibold tabular-nums"
                          : "text-sm tabular-nums text-muted-foreground"
                      }
                    >
                      {onBallotsLabel}
                    </span>
                    <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className={fullSupport ? "bg-chart-2" : "bg-chart-2/60"}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
