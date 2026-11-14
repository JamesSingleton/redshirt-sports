import { cn } from "@redshirt-sports/ui/lib/utils";
import { Check } from "lucide-react";
import type * as React from "react";

/*
 * Traditional mirrored bracket: left half, championship, right half. Shapes
 * match `buildBracketView` in @redshirt-sports/db/playoff-bracket; the types
 * are structural so this package does not depend on the database package.
 */

export type BracketTeamLike = {
  schoolId: string;
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
};

type Side = "a" | "b";

export type BracketSideLike<T extends BracketTeamLike> = {
  team: T | null;
  seed: number | null;
  showSeed: boolean;
  placeholder: string;
  score: number | null;
  isHome: boolean;
  isWinner: boolean;
  isLoser: boolean;
};

export type BracketGameLike<T extends BracketTeamLike> = {
  key: string;
  roundLabel: string;
  status: "scheduled" | "final";
  siteLabel: string | null;
  kickoffAt: Date | null;
  sideA: BracketSideLike<T>;
  sideB: BracketSideLike<T>;
  row: number;
  span: number;
  fedSides: Side[];
};

export type BracketHalfLike<T extends BracketTeamLike> = {
  rows: number;
  columns: {
    roundKey: string;
    roundLabel: string;
    games: BracketGameLike<T>[];
  }[];
};

export type BracketViewLike<T extends BracketTeamLike> = {
  left: BracketHalfLike<T>;
  right: BracketHalfLike<T>;
  final: BracketGameLike<T>;
  champion: T | null;
};

/** Makes every card a button that reports its game key. */
export type BracketSelection = {
  selectedKey: string | null;
  onSelect: (gameKey: string) => void;
};

/** Which row of which game a render prop is drawing. */
export type BracketSideAt = { gameKey: string; side: Side };

/**
 * Makes each team row a button that reports the game and side, for brackets
 * the reader fills in, once the game has both teams. The picked side is the
 * one marked `isWinner`. Rows are buttons, so `renderTeam` must not render
 * links.
 */
export type BracketPicking = {
  onPick: (gameKey: string, side: Side) => void;
};

type BracketProps<T extends BracketTeamLike> = {
  /** With selection, cards are buttons, so `renderTeam` must not render links. */
  selection?: BracketSelection;
  picking?: BracketPicking;
  /**
   * Replaces the whole row of a side with no team (null keeps the italic
   * placeholder), e.g. a control that fills the slot, or nothing at all on a
   * blank printout.
   */
  renderEmpty?: (
    side: BracketSideLike<T>,
    at: BracketSideAt,
  ) => React.ReactNode;
  /**
   * Leaves out the seed column for a team with no seed to show, so it starts
   * at the card's edge. Suits brackets where many teams are unseeded.
   */
  tightSeeds?: boolean;
  /** An extra control at the end of a row that has a team, e.g. "change". */
  renderTeamAction?: (
    side: BracketSideLike<T>,
    at: BracketSideAt,
  ) => React.ReactNode;
  view: BracketViewLike<T>;
  /** Logo and name for one team; the host app decides how teams link. */
  renderTeam: (team: T) => React.ReactNode;
  className?: string;
};

const kickoffFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

function teamLabel(team: BracketTeamLike) {
  return team.shortName ?? team.name ?? team.abbreviation ?? "TBD";
}

function sideName(side: BracketSideLike<BracketTeamLike>) {
  return side.team ? teamLabel(side.team) : side.placeholder;
}

/** What a card says aloud, since its button label replaces its contents. */
function gameLabel(
  game: BracketGameLike<BracketTeamLike>,
  details: (string | null)[],
) {
  const side = (s: BracketSideLike<BracketTeamLike>) =>
    [
      s.showSeed && s.seed !== null ? `No. ${s.seed}` : null,
      sideName(s),
      s.score,
    ]
      .filter((part) => part !== null)
      .join(" ");
  return [`${game.roundLabel}: ${side(game.sideA)} vs ${side(game.sideB)}`]
    .concat(details.filter((detail) => detail !== null))
    .join(", ");
}

/* Card geometry. A card is a header strip over two team rows, centred in its
 * grid rows, so the midpoint between its teams sits at 50% + head / 2. */
const TEAMS_MID = "(50% + var(--bracket-head) / 2)";
const LOWER_ROW = "(50% + var(--bracket-head) / 2 + var(--bracket-team-h) / 2)";
const UPPER_ROW = "(50% + var(--bracket-head) / 2 - var(--bracket-team-h) / 2)";

function TeamLine<T extends BracketTeamLike>({
  side,
  at,
  renderTeam,
  renderEmpty,
  renderTeamAction,
  tightSeeds,
  pick,
}: {
  side: BracketSideLike<T>;
  at: BracketSideAt;
  renderTeam: (team: T) => React.ReactNode;
  renderEmpty?: BracketProps<T>["renderEmpty"];
  renderTeamAction?: BracketProps<T>["renderTeamAction"];
  tightSeeds?: boolean;
  /** Set in picking mode: the row's spoken label and what a click does. */
  pick?: { label: string; onPick: () => void };
}) {
  const row = "flex h-(--bracket-team-h) w-full items-stretch text-sm";
  const tone = cn(
    side.isWinner && "font-semibold",
    side.isLoser && "text-muted-foreground",
  );
  const seedCell =
    "w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums";

  if (!side.team) {
    const custom = renderEmpty?.(side, at) ?? null;
    if (custom !== null) return <div className={row}>{custom}</div>;
    return (
      <div className={cn(row, "items-center gap-2 px-2")}>
        <span className={seedCell} />
        {/* Wraps instead of truncating, with room for the italic overhang. */}
        <span className="min-w-0 flex-1 pr-1 text-[0.8125rem] leading-tight text-muted-foreground italic">
          {side.placeholder}
        </span>
      </div>
    );
  }

  const content = (
    <>
      {tightSeeds && !side.showSeed ? null : (
        <span className={seedCell}>{side.showSeed ? side.seed : null}</span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
        {renderTeam(side.team)}
      </span>
      {side.score !== null ? (
        <span className="shrink-0 tabular-nums">{side.score}</span>
      ) : null}
    </>
  );
  const action = renderTeamAction?.(side, at) ?? null;
  const cell = "flex min-w-0 flex-1 items-center gap-2 px-2 text-left";

  return (
    <div className={cn(row, tone, pick && side.isWinner && "bg-primary/10")}>
      {pick ? (
        <button
          type="button"
          onClick={pick.onPick}
          aria-pressed={side.isWinner}
          aria-label={pick.label}
          className={cn(
            cell,
            "cursor-pointer outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
          )}
        >
          {content}
          {side.isWinner ? (
            <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
          ) : null}
        </button>
      ) : (
        <div className={cell}>{content}</div>
      )}
      {action}
    </div>
  );
}

function GameCard<T extends BracketTeamLike>({
  game,
  renderTeam,
  renderEmpty,
  renderTeamAction,
  tightSeeds,
  selection,
  picking,
  shift,
  className,
  style,
}: {
  game: BracketGameLike<T>;
  renderTeam: (team: T) => React.ReactNode;
  renderEmpty?: BracketProps<T>["renderEmpty"];
  renderTeamAction?: BracketProps<T>["renderTeamAction"];
  tightSeeds?: boolean;
  selection?: BracketSelection;
  picking?: BracketPicking;
  /** Moves the card so its line meets the slot it feeds head-on. */
  shift?: "up" | "down";
  className?: string;
  style?: React.CSSProperties;
}) {
  const home = game.sideA.isHome
    ? game.sideA.team
    : game.sideB.isHome
      ? game.sideB.team
      : null;
  const site = game.siteLabel ?? (home ? `at ${teamLabel(home)}` : null);
  const Card = selection ? "button" : "div";
  const status =
    game.status === "final"
      ? "Final"
      : game.kickoffAt
        ? kickoffFormat.format(game.kickoffAt)
        : null;
  const lines = (["a", "b"] as const).map((which) => {
    const side = which === "a" ? game.sideA : game.sideB;
    return (
      <TeamLine
        key={which}
        side={side}
        at={{ gameKey: game.key, side: which }}
        renderTeam={renderTeam}
        renderEmpty={renderEmpty}
        renderTeamAction={renderTeamAction}
        tightSeeds={tightSeeds}
        pick={
          // A winner needs someone to beat.
          picking && game.sideA.team && game.sideB.team
            ? {
                label: `${game.roundLabel}: pick ${sideName(side)} to win`,
                onPick: () => picking.onPick(game.key, which),
              }
            : undefined
        }
      />
    );
  });

  return (
    <div
      // The wrapper fills the card's grid rows, and a stacked semifinal's
      // rows cover the quarterfinal cards beside it: only the card itself
      // may take clicks, or it would block theirs.
      className={cn(
        "pointer-events-none relative z-10 flex flex-col justify-center",
        className,
      )}
      style={style}
      data-game-key={game.key}
    >
      <Card
        {...(selection
          ? {
              type: "button" as const,
              onClick: () => selection.onSelect(game.key),
              "aria-pressed": selection.selectedKey === game.key,
              "aria-label": gameLabel(game, [status, site]),
            }
          : {})}
        className={cn(
          "pointer-events-auto w-(--bracket-card) overflow-hidden rounded-md border border-border bg-card text-left text-card-foreground shadow-xs",
          selection &&
            "cursor-pointer outline-none transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          selection?.selectedKey === game.key &&
            "border-ring ring-2 ring-ring/40",
          shift === "down" && "translate-y-[calc(var(--bracket-team-h)/2)]",
          shift === "up" && "-translate-y-[calc(var(--bracket-team-h)/2)]",
        )}
      >
        <div
          className="flex h-(--bracket-head) items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
          title={[status, site].filter(Boolean).join(" · ") || undefined}
        >
          <span className="shrink-0">{status ?? game.roundLabel}</span>
          {site ? <span className="truncate normal-case">{site}</span> : null}
        </div>
        <div className="divide-y divide-border">{lines}</div>
      </Card>
    </div>
  );
}

const line = "absolute border-border";

/**
 * Lines from one column's games into a game of the next. Two feeders merge
 * into the middle of the card; a single feeder (the other side had a bye) was
 * shifted level with the slot it fills, so its line runs straight across.
 */
function Connector({
  game,
  feeders,
  mirrored,
}: {
  game: BracketGameLike<BracketTeamLike>;
  feeders: { row: number; span: number }[];
  mirrored: boolean;
}) {
  const rows = { gridRow: `${game.row + 1} / span ${game.span}` };

  if (game.fedSides.length === 1) {
    const y = game.fedSides[0] === "a" ? UPPER_ROW : LOWER_ROW;
    return (
      <div aria-hidden className="relative" style={rows}>
        <span
          className={cn(line, "inset-x-0 border-t")}
          style={{ top: `calc${y}` }}
        />
      </div>
    );
  }

  const centers = feeders.map(
    (feeder) => ((feeder.row + feeder.span / 2 - game.row) / game.span) * 100,
  );
  const top = Math.min(...centers);
  const bottom = Math.max(...centers);
  const offset = "var(--bracket-head) / 2";

  return (
    <div
      aria-hidden
      className={cn("relative", mirrored && "-scale-x-100")}
      style={rows}
    >
      {centers.map((center) => (
        <span
          key={center}
          className={cn(line, "left-0 w-1/2 border-t")}
          style={{ top: `calc(${center}% + ${offset})` }}
        />
      ))}
      <span
        className={cn(line, "left-1/2 border-l")}
        style={{
          top: `calc(${top}% + ${offset})`,
          height: `${bottom - top}%`,
        }}
      />
      <span
        className={cn(line, "right-0 w-1/2 border-t")}
        style={{ top: `calc${TEAMS_MID}` }}
      />
    </div>
  );
}

type Column<T extends BracketTeamLike> = BracketHalfLike<T>["columns"][number];

/**
 * The last round of a half shares the column before it when that column's
 * games are two rows apart or more: the card fits between its feeders, the
 * way printed brackets stack the semifinal between the quarterfinals.
 */
function stackLastColumn<T extends BracketTeamLike>(half: BracketHalfLike<T>) {
  const columns = half.columns;
  const last = columns.at(-1);
  const before = columns.at(-2);
  if (!last || !before || before.games.some((game) => game.span < 2)) {
    return { columns, stacked: null };
  }
  return { columns: columns.slice(0, -1), stacked: last };
}

function Half<T extends BracketTeamLike>({
  half,
  side,
  renderTeam,
  renderEmpty,
  renderTeamAction,
  tightSeeds,
  selection,
  picking,
}: {
  selection?: BracketSelection;
  picking?: BracketPicking;
  half: BracketHalfLike<T>;
  side: "left" | "right";
  renderTeam: (team: T) => React.ReactNode;
  renderEmpty?: BracketProps<T>["renderEmpty"];
  renderTeamAction?: BracketProps<T>["renderTeamAction"];
  tightSeeds?: boolean;
}) {
  const mirrored = side === "right";
  const { columns, stacked } = stackLastColumn(half);
  const gridRows = {
    gridTemplateRows: `repeat(${half.rows}, var(--bracket-unit))`,
  };
  const tracks: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  // A game that alone feeds a bye game moves level with the slot it fills.
  const shifts = new Map<string, "up" | "down">();
  columns.forEach((column, index) => {
    const previous = columns[index - 1];
    for (const game of column.games) {
      if (!previous || game.fedSides.length !== 1) continue;
      const feeder = previous.games.find((item) => item.row === game.row);
      if (feeder)
        shifts.set(feeder.key, game.fedSides[0] === "a" ? "up" : "down");
    }
  });

  columns.forEach((column: Column<T>, index) => {
    const previous = columns[index - 1];
    if (previous) {
      tracks.push(
        <div
          key={`${column.roundKey}-lines`}
          className="grid w-(--bracket-gap)"
          style={gridRows}
        >
          {column.games
            .filter((game) => game.fedSides.length > 0)
            .map((game) => (
              <Connector
                key={game.key}
                game={game}
                mirrored={mirrored}
                feeders={previous.games.filter(
                  (feeder) =>
                    feeder.row >= game.row &&
                    feeder.row + feeder.span <= game.row + game.span,
                )}
              />
            ))}
        </div>,
      );
      labels.push(
        <div
          key={`${column.roundKey}-gap`}
          className="w-(--bracket-gap) shrink-0"
        />,
      );
    }

    const isStackColumn = stacked !== null && index === columns.length - 1;
    tracks.push(
      <div
        key={column.roundKey}
        className="relative grid w-(--bracket-card)"
        style={gridRows}
      >
        {isStackColumn
          ? stacked.games.map((game) => (
              <span
                key={`${game.key}-stem`}
                aria-hidden
                className={cn(line, "left-1/2 border-l")}
                style={{
                  top: `calc(${((game.row + game.span / 4) / half.rows) * 100}% + var(--bracket-head) / 2)`,
                  height: `${(game.span / 2 / half.rows) * 100}%`,
                }}
              />
            ))
          : null}
        {[...column.games, ...(isStackColumn ? stacked.games : [])].map(
          (game) => (
            <GameCard
              key={game.key}
              game={game}
              renderTeam={renderTeam}
              renderEmpty={renderEmpty}
              renderTeamAction={renderTeamAction}
              tightSeeds={tightSeeds}
              selection={selection}
              picking={picking}
              shift={shifts.get(game.key)}
              style={{
                gridRow: `${game.row + 1} / span ${game.span}`,
                gridColumn: 1,
              }}
            />
          ),
        )}
      </div>,
    );
    // Column captions, not headings: a bracket sits under any heading level
    // (an article's h2, the page's h1), and each card names its round itself.
    labels.push(
      <div
        key={`${column.roundKey}-label`}
        className="w-(--bracket-card) shrink-0 truncate px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {column.roundLabel}
      </div>,
    );
  });

  tracks.push(
    <div key="to-final" aria-hidden className="relative w-(--bracket-gap)">
      <span
        className={cn(line, "inset-x-0 border-t")}
        style={{ top: `calc${TEAMS_MID}` }}
      />
    </div>,
  );
  labels.push(
    <div key="to-final-gap" className="w-(--bracket-gap) shrink-0" />,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("flex", mirrored && "flex-row-reverse")}>{labels}</div>
      <div className={cn("flex", mirrored && "flex-row-reverse")}>{tracks}</div>
    </div>
  );
}

export function Bracket<T extends BracketTeamLike>({
  view,
  renderTeam,
  renderEmpty,
  renderTeamAction,
  tightSeeds,
  selection,
  picking,
  className,
}: BracketProps<T>) {
  const shared = {
    renderTeam,
    renderEmpty,
    renderTeamAction,
    tightSeeds,
    selection,
    picking,
  };
  return (
    <div
      className={cn(
        "[--bracket-card:11.5rem] [--bracket-gap:1.25rem] [--bracket-head:1.375rem] [--bracket-team-h:2.25rem] [--bracket-unit:9.5rem]",
        "overflow-x-auto overscroll-x-contain pb-3",
        className,
      )}
    >
      <div className="mx-auto flex w-max items-stretch">
        <Half half={view.left} side="left" {...shared} />
        <div className="flex flex-col gap-3">
          <div className="w-(--bracket-card) truncate px-1 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {view.final.roundLabel}
          </div>
          <div className="relative flex flex-1 flex-col justify-center">
            <div className="absolute inset-x-0 bottom-[calc(50%+var(--bracket-team-h)+var(--bracket-head)/2+1rem)] flex flex-col items-center gap-1 text-center">
              <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {view.champion ? "Champion" : "National championship"}
              </span>
              {view.champion ? (
                <span className="font-display text-lg font-bold leading-tight">
                  {teamLabel(view.champion)}
                </span>
              ) : null}
            </div>
            <GameCard game={view.final} {...shared} />
          </div>
        </div>
        <Half half={view.right} side="right" {...shared} />
      </div>
    </div>
  );
}
