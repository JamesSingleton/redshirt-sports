import type {
  BracketFormatSpec,
  BracketGameSpec,
  BracketSideSpec,
  BracketSlotSpec,
} from "./types";
import { rootGame } from "./validate-spec";

export type BracketSide = "a" | "b";

export type BracketTeam = {
  schoolId: string;
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
  slug: string | null;
  image: unknown;
};

/** A filled slot, as stored in `bracket_slots` with its school joined. */
export type BracketSlotEntry = {
  slotKey: string;
  team: BracketTeam;
  bidType: string | null;
  bidLabel: string | null;
};

/** Stored state for one game, as in `bracket_games`. */
export type BracketGameState = {
  gameKey: string;
  homeSide: string | null;
  siteLabel: string | null;
  kickoffAt: Date | null;
  status: string;
  sideAScore: number | null;
  sideBScore: number | null;
  winnerSide: string | null;
};

export type BracketSideView = {
  team: BracketTeam | null;
  /** The team's seed, shown or not. Null while the side is undecided. */
  seed: number | null;
  showSeed: boolean;
  /** Shown when there is no team yet, e.g. "Winner: UNH / LAF". */
  placeholder: string;
  /** True for a slot that enters after the first round (a bye). */
  byeEntry: boolean;
  bidType: string | null;
  bidLabel: string | null;
  score: number | null;
  isHome: boolean;
  isWinner: boolean;
  isLoser: boolean;
};

export type BracketGameView = {
  key: string;
  roundKey: string;
  roundLabel: string;
  status: "scheduled" | "final";
  neutral: boolean;
  siteLabel: string | null;
  kickoffAt: Date | null;
  sideA: BracketSideView;
  sideB: BracketSideView;
  /** First grid row (0-based) and row count inside its half. */
  row: number;
  span: number;
  /** Which sides are fed by a game in the previous column. */
  fedSides: BracketSide[];
  /** The game feeding each side, when a side is not a slot. */
  feeders: Partial<Record<BracketSide, string>>;
};

export type BracketColumnView = {
  roundKey: string;
  roundLabel: string;
  games: BracketGameView[];
};

export type BracketHalfView = {
  /** Grid rows in the half; every column shares them. */
  rows: number;
  /** Outermost round first. */
  columns: BracketColumnView[];
};

export type BracketView = {
  left: BracketHalfView;
  right: BracketHalfView;
  final: BracketGameView;
  champion: BracketTeam | null;
};

type Resolved = {
  team: BracketTeam | null;
  seed: number | null;
  showSeed: boolean;
  placeholder: string;
  byeEntry: boolean;
  bidType: string | null;
  bidLabel: string | null;
};

function shortLabel(side: Resolved): string | null {
  if (side.team) {
    return side.team.abbreviation ?? side.team.shortName ?? side.team.name;
  }
  return null;
}

/**
 * Lays out a format's tree for rendering and resolves every side to a team.
 * The championship's `sideA` subtree is the left half and `sideB` the right.
 * A side is its slot's school, else the feeder game's winner, else a
 * placeholder. Structure always comes from the spec; rows only add state.
 */
export function buildBracketView(
  spec: BracketFormatSpec,
  slots: BracketSlotEntry[],
  games: BracketGameState[],
): BracketView {
  const gameSpecs = new Map(spec.games.map((game) => [game.key, game]));
  const slotSpecs = new Map<string, BracketSlotSpec>(
    spec.slots.map((slot) => [slot.key, slot]),
  );
  const slotEntries = new Map(slots.map((slot) => [slot.slotKey, slot]));
  const states = new Map(games.map((game) => [game.gameKey, game]));
  const firstRound = spec.rounds[0]?.key;
  const roundOrder = new Map(
    spec.rounds.map((round, index) => [round.key, index]),
  );
  const views = new Map<string, BracketGameView>();

  function resolveSlot(slotKey: string, roundKey: string): Resolved {
    const slotSpec = slotSpecs.get(slotKey);
    const entry = slotEntries.get(slotKey);
    const seed = slotSpec?.seed ?? null;
    const showSeed = slotSpec?.showSeed ?? false;
    return {
      team: entry?.team ?? null,
      seed,
      showSeed,
      placeholder: showSeed && seed !== null ? `No. ${seed} seed` : "TBD",
      byeEntry: roundKey !== firstRound,
      bidType: entry?.bidType ?? null,
      bidLabel: entry?.bidLabel ?? null,
    };
  }

  function resolveSide(side: BracketSideSpec, roundKey: string): Resolved {
    if ("slotKey" in side) return resolveSlot(side.slotKey, roundKey);

    const feeder = gameView(side.fromGameKey);
    const winner =
      feeder.status === "final"
        ? feeder.sideA.isWinner
          ? feeder.sideA
          : feeder.sideB
        : null;
    if (winner?.team) {
      return {
        team: winner.team,
        seed: winner.seed,
        showSeed: winner.showSeed,
        placeholder: winner.placeholder,
        byeEntry: false,
        bidType: winner.bidType,
        bidLabel: winner.bidLabel,
      };
    }

    const a = shortLabel(feeder.sideA);
    const b = shortLabel(feeder.sideB);
    return {
      team: null,
      seed: null,
      showSeed: false,
      placeholder: a && b ? `Winner: ${a} / ${b}` : "TBD",
      byeEntry: false,
      bidType: null,
      bidLabel: null,
    };
  }

  // Best (lowest) seed number that could come out of a side.
  function bestSeed(side: BracketSideSpec): number | null {
    if ("slotKey" in side) return slotSpecs.get(side.slotKey)?.seed ?? null;
    const feeder = gameSpecs.get(side.fromGameKey);
    if (!feeder) return null;
    const seeds = [bestSeed(feeder.sideA), bestSeed(feeder.sideB)].filter(
      (seed): seed is number => seed !== null,
    );
    return seeds.length > 0 ? Math.min(...seeds) : null;
  }

  /**
   * The editor's override, else the higher seed. A known seed already hosts
   * when no team that could still arrive on the other side outranks it.
   */
  function homeSide(
    game: BracketGameSpec,
    state: BracketGameState | undefined,
    a: Resolved,
    b: Resolved,
  ): BracketSide | null {
    if (state?.homeSide === "a" || state?.homeSide === "b") {
      return state.homeSide;
    }
    if (game.host === "neutral") return null;
    if (a.seed !== null && b.seed !== null) {
      return a.seed <= b.seed ? "a" : "b";
    }
    if (a.seed !== null && b.seed === null) {
      const best = bestSeed(game.sideB);
      return best !== null && a.seed < best ? "a" : null;
    }
    if (b.seed !== null && a.seed === null) {
      const best = bestSeed(game.sideA);
      return best !== null && b.seed < best ? "b" : null;
    }
    return null;
  }

  function gameView(key: string): BracketGameView {
    const cached = views.get(key);
    if (cached) return cached;

    const game = gameSpecs.get(key);
    if (!game) throw new Error(`Unknown bracket game ${key}`);
    const state = states.get(key);
    const a = resolveSide(game.sideA, game.roundKey);
    const b = resolveSide(game.sideB, game.roundKey);
    const status = state?.status === "final" ? "final" : "scheduled";
    const winner = status === "final" ? state?.winnerSide : null;
    const home = homeSide(game, state, a, b);

    const side = (
      resolved: Resolved,
      which: BracketSide,
      score: number | null,
    ): BracketSideView => ({
      ...resolved,
      score,
      isHome: home === which,
      isWinner: winner === which,
      isLoser: winner != null && winner !== which,
    });

    const view: BracketGameView = {
      key,
      roundKey: game.roundKey,
      roundLabel: game.roundLabel,
      status,
      neutral: game.host === "neutral" && !state?.homeSide,
      siteLabel: state?.siteLabel ?? null,
      kickoffAt: state?.kickoffAt ?? null,
      sideA: side(a, "a", state?.sideAScore ?? null),
      sideB: side(b, "b", state?.sideBScore ?? null),
      row: 0,
      span: 1,
      feeders: {
        ...("fromGameKey" in game.sideA ? { a: game.sideA.fromGameKey } : {}),
        ...("fromGameKey" in game.sideB ? { b: game.sideB.fromGameKey } : {}),
      },
      fedSides: [
        ...("fromGameKey" in game.sideA ? (["a"] as const) : []),
        ...("fromGameKey" in game.sideB ? (["b"] as const) : []),
      ],
    };
    views.set(key, view);
    return view;
  }

  function feederKeys(game: BracketGameSpec): string[] {
    return [game.sideA, game.sideB].flatMap((side) =>
      "fromGameKey" in side ? [side.fromGameKey] : [],
    );
  }

  // A game with no feeder games takes one row; otherwise it covers its
  // feeders' rows, so a bye game sits level with the game that feeds it.
  function rowsFor(key: string): number {
    const feeders = feederKeys(gameSpecs.get(key)!);
    if (feeders.length === 0) return 1;
    return feeders.reduce((sum, feeder) => sum + rowsFor(feeder), 0);
  }

  function place(key: string, row: number, out: BracketGameView[]) {
    const view = gameView(key);
    view.row = row;
    view.span = rowsFor(key);
    out.push(view);
    let next = row;
    for (const feeder of feederKeys(gameSpecs.get(key)!)) {
      place(feeder, next, out);
      next += rowsFor(feeder);
    }
  }

  function half(side: BracketSideSpec): BracketHalfView {
    if (!("fromGameKey" in side)) {
      throw new Error("A bracket half must start from a game");
    }
    const placed: BracketGameView[] = [];
    place(side.fromGameKey, 0, placed);
    const roundKeys = [...new Set(placed.map((game) => game.roundKey))].sort(
      (x, y) => (roundOrder.get(x) ?? 0) - (roundOrder.get(y) ?? 0),
    );
    return {
      rows: rowsFor(side.fromGameKey),
      columns: roundKeys.map((roundKey) => ({
        roundKey,
        roundLabel:
          spec.rounds.find((round) => round.key === roundKey)?.label ??
          roundKey,
        games: placed
          .filter((game) => game.roundKey === roundKey)
          .sort((x, y) => x.row - y.row),
      })),
    };
  }

  const root = rootGame(spec);
  const left = half(root.sideA);
  const right = half(root.sideB);
  const final = gameView(root.key);
  const champion =
    final.status === "final"
      ? final.sideA.isWinner
        ? final.sideA.team
        : final.sideB.team
      : null;

  return { left, right, final, champion };
}
