import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { cn } from "@redshirt-sports/ui/lib/utils";

import { TeamMark } from "@/components/rankings/team-mark";
import { TeamPageLink } from "@/components/rankings/team-page-link";
import { formatPollPoints } from "@/lib/format-poll-points";
import type { DroppedOutTeam, RankingTeamRef } from "@/lib/rankings-movement";
import { displayName } from "@/lib/rankings-movement";

type BeyondTop25Props = {
  othersReceivingVotes: RankingTeamRef[];
  droppedOut: DroppedOutTeam[];
  noLongerReceivingVotes: RankingTeamRef[];
  ballotsCounted: number;
  currentRankingsById: Map<string, RankingTeamRef>;
  ballotsListedBySanityId: Record<string, number>;
};

/** Multi-column ORV only when the card is full width and the list is long enough. */
function othersReceivingVotesGridClass(count: number): string | null {
  if (count <= 10) {
    return null;
  }
  if (count <= 18) {
    return "grid gap-x-6 sm:grid-cols-2";
  }
  if (count <= 20) {
    return "grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3";
  }
  return "grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

function listedLabel(
  teamId: string,
  ballotsCounted: number,
  ballotsListedBySanityId: Record<string, number>,
): string {
  const listed = ballotsListedBySanityId[teamId] ?? 0;
  const word = ballotsCounted === 1 ? "ballot" : "ballots";
  return `on ${listed} of ${ballotsCounted} ${word}`;
}

export function RankingsBeyondTop25({
  othersReceivingVotes,
  droppedOut,
  noLongerReceivingVotes,
  ballotsCounted,
  currentRankingsById,
  ballotsListedBySanityId,
}: BeyondTop25Props) {
  const hasContent =
    othersReceivingVotes.length > 0 ||
    droppedOut.length > 0 ||
    noLongerReceivingVotes.length > 0;

  if (!hasContent) {
    return null;
  }

  const orvCount = othersReceivingVotes.length;
  const sideCardCount =
    (droppedOut.length > 0 ? 1 : 0) +
    (noLongerReceivingVotes.length > 0 ? 1 : 0);
  const orvOnly = orvCount > 0 && sideCardCount === 0;
  /** ORV beside dropped / no-longer cards in one column is too narrow for a grid. */
  const useStackedSection = orvCount > 0 && sideCardCount > 0;
  const orvFullWidth = orvOnly || useStackedSection || orvCount > 8;
  const orvGridClass = orvFullWidth
    ? othersReceivingVotesGridClass(orvCount)
    : null;
  const orvInGrid = orvGridClass != null;

  const orvList = othersReceivingVotes.map((team) => {
    const listed = listedLabel(
      team._id,
      ballotsCounted,
      ballotsListedBySanityId,
    );
    return (
      <li
        key={team._id}
        className={cn(
          "gap-2 border-b py-2 text-sm last:border-0",
          orvInGrid
            ? "flex min-w-0 flex-col border-border/60 sm:flex-row sm:items-center"
            : "flex items-center",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamMark
            image={team.image}
            shortName={team.shortName}
            abbreviation={team.abbreviation}
            name={team.name}
            size="sm"
          />
          <span className="min-w-0 flex-1">
            <TeamPageLink
              slug={team.slug}
              className="block truncate font-medium hover:underline"
            >
              {displayName(team)}
            </TeamPageLink>
            {orvInGrid ? (
              <span className="block text-sm text-muted-foreground tabular-nums">
                {listed}
              </span>
            ) : null}
          </span>
        </div>
        {!orvInGrid ? (
          <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
            {listed}
          </span>
        ) : null}
        <span
          className={cn(
            "shrink-0 font-semibold tabular-nums",
            orvInGrid ? "text-right sm:w-14" : "text-right sm:w-12",
          )}
        >
          {formatPollPoints(team._points)}
        </span>
      </li>
    );
  });

  const orvCard =
    orvCount > 0 ? (
      <Card
        className={cn(
          "gap-0 shadow-xs",
          orvFullWidth && !useStackedSection && "md:col-span-3",
          useStackedSection && "w-full",
        )}
      >
        <CardHeader className="px-5 pt-5">
          <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
            Others receiving votes
          </CardTitle>
          <CardDescription>Points &gt; 0, outside the Top 25</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pt-2 pb-4">
          <ul className={cn(orvGridClass)}>{orvList}</ul>
        </CardContent>
      </Card>
    ) : null;

  return (
    <section className="pt-8" aria-label="Beyond the Top 25">
      <h2 className="font-display text-2xl font-extrabold uppercase">
        Beyond the Top 25
      </h2>
      {useStackedSection ? (
        <div className="mt-3 flex flex-col gap-4">
          {orvCard}
          <div className="grid gap-4 md:grid-cols-2">
            {droppedOut.length > 0 ? (
              <DroppedOutCard
                droppedOut={droppedOut}
                currentRankingsById={currentRankingsById}
              />
            ) : null}
            {noLongerReceivingVotes.length > 0 ? (
              <NoLongerCard teams={noLongerReceivingVotes} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {orvCard}
          {droppedOut.length > 0 ? (
            <DroppedOutCard
              droppedOut={droppedOut}
              currentRankingsById={currentRankingsById}
            />
          ) : null}
          {noLongerReceivingVotes.length > 0 ? (
            <NoLongerCard teams={noLongerReceivingVotes} />
          ) : null}
        </div>
      )}
    </section>
  );
}

function DroppedOutCard({
  droppedOut,
  currentRankingsById,
}: {
  droppedOut: DroppedOutTeam[];
  currentRankingsById: Map<string, RankingTeamRef>;
}) {
  return (
    <Card className="gap-0 shadow-xs">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
          Dropped out of the Top 25
        </CardTitle>
        <CardDescription>
          Ranked last week, not in the Top 25 this week
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-2 pb-4">
        <ul>
          {droppedOut.map((team) => {
            const current = currentRankingsById.get(team._id);
            const thisWeek = current
              ? `This week: receiving votes · ${formatPollPoints(current._points)}`
              : "This week: no votes";

            return (
              <li
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
                <span className="min-w-0 flex-1">
                  <TeamPageLink
                    slug={team.slug}
                    className="block truncate font-medium hover:underline"
                  >
                    {displayName(team)}
                  </TeamPageLink>
                  <span className="block text-sm text-muted-foreground">
                    {thisWeek}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm uppercase tracking-wide text-muted-foreground">
                    Last week
                  </span>
                  <b className="font-display text-lg tabular-nums">
                    No. {team.previousRank}
                  </b>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function NoLongerCard({ teams }: { teams: RankingTeamRef[] }) {
  return (
    <Card className="gap-0 shadow-xs">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-xl font-bold uppercase leading-none tracking-wide">
          No longer receiving votes
        </CardTitle>
        <CardDescription>Had points last week, none this week</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-2 pb-4">
        <ul>
          {teams.map((team) => (
            <li
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
              <span className="min-w-0 flex-1">
                <TeamPageLink
                  slug={team.slug}
                  className="block truncate font-medium hover:underline"
                >
                  {displayName(team)}
                </TeamPageLink>
                <span className="block text-sm text-muted-foreground">
                  This week: 0 points
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm uppercase tracking-wide text-muted-foreground">
                  Last week
                </span>
                {team.rank != null && team.rank <= 25 ? (
                  <b className="font-display text-lg tabular-nums">
                    No. {team.rank}
                  </b>
                ) : (
                  <b className="text-sm tabular-nums">
                    RV · {formatPollPoints(team._points)}
                  </b>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
