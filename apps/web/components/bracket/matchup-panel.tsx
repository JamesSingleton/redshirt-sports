import {
  type BracketGameView,
  type BracketSideView,
  type BracketTeam,
  type BracketTeamStats,
  type BracketTeamStatsSet,
  formatWinLoss,
  headToHead,
  type TeamResult,
} from "@redshirt-sports/db/playoff-bracket";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Separator } from "@redshirt-sports/ui/components/separator";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import { TeamMark } from "@/components/rankings/team-mark";
import { TeamPageLink } from "@/components/rankings/team-page-link";

const kickoffFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function teamName(team: BracketTeam) {
  return team.shortName ?? team.name ?? "Team";
}

function homeSide(game: BracketGameView) {
  return game.sideA.isHome ? game.sideA : game.sideB.isHome ? game.sideB : null;
}

function bidText(side: BracketSideView) {
  const bid =
    side.bidType === "auto"
      ? "Auto bid"
      : side.bidType === "at-large"
        ? "At-large"
        : null;
  return [side.bidLabel, bid].filter(Boolean).join(" · ") || null;
}

/** For an undecided side: the game that decides it and who is playing. */
function PossibleTeams({
  feeder,
  stats,
}: {
  feeder: BracketGameView;
  stats: BracketTeamStatsSet;
}) {
  const sides = [feeder.sideA, feeder.sideB].filter((side) => side.team);
  if (sides.length === 0) return null;
  const when = feeder.kickoffAt ? shortDate.format(feeder.kickoffAt) : null;
  return (
    <div className="ml-[3.25rem] flex flex-col gap-1.5 pb-2 text-sm">
      <span className="text-muted-foreground text-xs">
        Winner of the {feeder.roundLabel.toLowerCase()} game
        {when ? ` on ${when}` : ""}:
      </span>
      {sides.map((side) => {
        const team = side.team!;
        const record = stats.teams[team.schoolId]?.record;
        return (
          <span key={team.schoolId} className="flex items-center gap-2">
            <TeamMark
              image={team.image}
              shortName={team.shortName}
              abbreviation={team.abbreviation}
              name={team.name}
              size="xs"
            />
            <span className="truncate">
              {side.showSeed && side.seed !== null ? `${side.seed}. ` : ""}
              {teamName(team)}
            </span>
            {record ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatWinLoss(record)}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function TeamHeader({
  side,
  stats,
  final,
}: {
  side: BracketSideView;
  stats: BracketTeamStats | undefined;
  final: boolean;
}) {
  const team = side.team;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3",
        side.isWinner && "bg-muted",
      )}
    >
      {team ? (
        <TeamMark
          image={team.image}
          shortName={team.shortName}
          abbreviation={team.abbreviation}
          name={team.name}
          size="md"
        />
      ) : (
        <span className="size-10 shrink-0 rounded-full border border-dashed border-border" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {team && side.showSeed && side.seed !== null ? (
            <Badge variant="secondary" className="tabular-nums">
              {side.seed}
            </Badge>
          ) : null}
          <span className="truncate font-semibold">
            {team ? (
              <TeamPageLink slug={team.slug}>{teamName(team)}</TeamPageLink>
            ) : (
              <span className="text-muted-foreground italic">
                {side.placeholder}
              </span>
            )}
          </span>
        </div>
        <span className="text-muted-foreground truncate text-xs">
          {[bidText(side), stats ? formatWinLoss(stats.record) : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      {final && side.score !== null ? (
        <span
          className={cn(
            "font-display text-3xl font-bold tabular-nums",
            side.isLoser && "text-muted-foreground",
          )}
        >
          {side.score}
        </span>
      ) : null}
    </div>
  );
}

/** Column heading for the comparison: logo and short name, or TBD. */
function CompareTeam({
  side,
  align,
}: {
  side: BracketSideView;
  align: "start" | "end";
}) {
  const team = side.team;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        align === "end" && "flex-row-reverse",
      )}
    >
      {team ? (
        <TeamMark
          image={team.image}
          shortName={team.shortName}
          abbreviation={team.abbreviation}
          name={team.name}
          size="xs"
        />
      ) : null}
      <span className={cn(!team && "text-muted-foreground italic")}>
        {team ? (team.abbreviation ?? teamName(team)) : "TBD"}
      </span>
    </span>
  );
}

type Row = {
  label: string;
  a: string;
  b: string;
  /** Which side is better; lower is better for ranks. */
  better: "a" | "b" | null;
};

function rankRow(
  label: string,
  a: number | null | undefined,
  b: number | null | undefined,
): Row {
  return {
    label,
    a: a != null ? `#${a}` : "—",
    b: b != null ? `#${b}` : "—",
    better: a != null && b != null && a !== b ? (a < b ? "a" : "b") : null,
  };
}

function pct(record: BracketTeamStats["record"]) {
  const games = record.wins + record.losses;
  return games === 0 ? 0 : record.wins / games;
}

function comparisonRows(
  a: BracketTeamStats | undefined,
  b: BracketTeamStats | undefined,
): Row[] {
  const recordBetter =
    a && b && pct(a.record) !== pct(b.record)
      ? pct(a.record) > pct(b.record)
        ? "a"
        : "b"
      : null;
  const pollA = a?.poll ? `#${a.poll.rank}` : a ? "NR" : "—";
  const pollB = b?.poll ? `#${b.poll.rank}` : b ? "NR" : "—";
  // Unranked sorts after every ranked team.
  const pollRank = (team: BracketTeamStats) => team.poll?.rank ?? Infinity;
  const pollBetter =
    a && b && pollRank(a) !== pollRank(b)
      ? pollRank(a) < pollRank(b)
        ? "a"
        : "b"
      : null;
  return [
    {
      label: "Record",
      a: a ? formatWinLoss(a.record) : "—",
      b: b ? formatWinLoss(b.record) : "—",
      better: recordBetter,
    },
    {
      label: "vs. FCS",
      a: a ? formatWinLoss(a.divisionRecord) : "—",
      b: b ? formatWinLoss(b.divisionRecord) : "—",
      better: null,
    },
    { label: "Top 25", a: pollA, b: pollB, better: pollBetter },
    rankRow("Power", a?.ratings?.powerRank, b?.ratings?.powerRank),
    rankRow("Strength of record", a?.ratings?.sorRank, b?.ratings?.sorRank),
    rankRow("Strength of schedule", a?.ratings?.sosRank, b?.ratings?.sosRank),
  ];
}

function resultLine(result: TeamResult) {
  const where =
    result.site === "home" ? "vs." : result.site === "away" ? "at" : "vs.";
  return `${where} ${result.opponentName}`;
}

function ResultList({ results }: { results: TeamResult[] }) {
  if (results.length === 0) {
    return <p className="text-muted-foreground text-sm">No games yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {results.map((result) => (
        <li
          key={result.gameId}
          className="flex items-center gap-2 text-sm tabular-nums"
        >
          <Badge
            variant={result.won ? "secondary" : "outline"}
            className="w-6 justify-center px-0"
          >
            {result.won ? "W" : "L"}
          </Badge>
          <span className="w-12 shrink-0">
            {result.teamScore}-{result.opponentScore}
            {result.overtime ? "*" : ""}
          </span>
          <span className="min-w-0 flex-1 truncate">{resultLine(result)}</span>
          <span className="text-muted-foreground text-xs">
            {result.kickoffAt ? shortDate.format(result.kickoffAt) : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LastFive({
  side,
  team,
}: {
  side: BracketSideView;
  team: BracketTeamStats | undefined;
}) {
  if (!team) return null;
  return (
    <section className="flex flex-col gap-2">
      <Separator />
      <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
        {/* Stats exist only for placed schools. */}
        {teamName(side.team!)}: last 5
      </h3>
      <ResultList results={team.results.slice(-5).reverse()} />
    </section>
  );
}

function Notes({
  game,
  a,
  b,
}: {
  game: BracketGameView;
  a: BracketTeamStats | undefined;
  b: BracketTeamStats | undefined;
}) {
  const notes: string[] = [];
  if (a && b) {
    for (const result of headToHead(a, b.schoolId)) {
      const winner = teamName((result.won ? game.sideA : game.sideB).team!);
      const high = Math.max(result.teamScore, result.opponentScore);
      const low = Math.min(result.teamScore, result.opponentScore);
      const date = result.kickoffAt ? shortDate.format(result.kickoffAt) : "";
      notes.push(
        `Rematch: ${winner} won ${high}-${low}${result.overtime ? " in overtime" : ""} on ${date}.`,
      );
    }
  }
  if (
    game.sideA.bidLabel &&
    game.sideA.bidLabel === game.sideB.bidLabel &&
    a &&
    b
  ) {
    notes.push(
      `Conference matchup: both teams play in the ${game.sideA.bidLabel}.`,
    );
  }
  if (notes.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
        Notes
      </h3>
      <ul className="flex flex-col gap-1.5 text-sm">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}

/** Everything about one bracket game: when, where, and how the teams stack up. */
export function MatchupPanel({
  game,
  games,
  stats,
  sport,
  division,
}: {
  game: BracketGameView;
  /** Every game by key, to show who could fill an undecided side. */
  games: Map<string, BracketGameView>;
  stats: BracketTeamStatsSet;
  sport: string;
  division: string;
}) {
  const a = game.sideA.team ? stats.teams[game.sideA.team.schoolId] : undefined;
  const b = game.sideB.team ? stats.teams[game.sideB.team.schoolId] : undefined;
  const final = game.status === "final";
  const home = homeSide(game);
  const site =
    game.siteLabel ??
    (home?.team
      ? `at ${teamName(home.team)}`
      : game.neutral
        ? "Neutral site"
        : null);
  const when = final
    ? "Final"
    : game.kickoffAt
      ? kickoffFormat.format(game.kickoffAt)
      : "Date and time TBA";
  const rows = comparisonRows(a, b);
  const { asOf } = stats;

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">When</dt>
        <dd>{when}</dd>
        <dt className="text-muted-foreground">Where</dt>
        <dd>{site ?? "Site TBA"}</dd>
      </dl>

      <div className="flex flex-col gap-1">
        {(["a", "b"] as const).map((which) => {
          const side = which === "a" ? game.sideA : game.sideB;
          const feederKey = game.feeders[which];
          const feeder =
            !side.team && feederKey ? games.get(feederKey) : undefined;
          return (
            <div key={which}>
              <TeamHeader
                side={side}
                stats={which === "a" ? a : b}
                final={final}
              />
              {feeder ? <PossibleTeams feeder={feeder} stats={stats} /> : null}
            </div>
          );
        })}
      </div>

      {a || b ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
            Compare
          </h3>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 text-right font-medium">
                  <CompareTeam side={game.sideA} align="end" />
                </th>
                <th scope="col" className="px-3 py-1.5">
                  <span className="sr-only">Stat</span>
                </th>
                <th scope="col" className="py-1.5 text-left font-medium">
                  <CompareTeam side={game.sideB} align="start" />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border last:border-0"
                >
                  <td
                    className={cn(
                      "py-1.5 text-right",
                      row.better === "a"
                        ? "font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.a}
                  </td>
                  <td className="text-muted-foreground px-3 py-1.5 text-center text-xs tracking-wide uppercase">
                    {row.label}
                  </td>
                  <td
                    className={cn(
                      "py-1.5",
                      row.better === "b"
                        ? "font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {row.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted-foreground text-xs">
            {asOf.pollWeek !== null ? (
              <>
                <Link
                  href={`/college/${sport}/rankings/${division}`}
                  className="underline underline-offset-2"
                >
                  Redshirt Top 25
                </Link>{" "}
                after Week {asOf.pollWeek}.{" "}
              </>
            ) : null}
            {asOf.ratingsWeek !== null ? (
              <>
                <Link
                  href={`/college/${sport}/ratings/${division}`}
                  className="underline underline-offset-2"
                >
                  Computer ratings
                </Link>{" "}
                through Week {asOf.ratingsWeek}
                {asOf.ratingsPoolSize
                  ? `, ranked among ${asOf.ratingsPoolSize} teams`
                  : ""}
                .
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <Notes game={game} a={a} b={b} />

      <LastFive side={game.sideA} team={a} />
      <LastFive side={game.sideB} team={b} />
    </div>
  );
}
