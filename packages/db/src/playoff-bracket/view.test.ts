import { describe, expect, it } from "vitest";

import { BRACKET_FORMAT_SEEDS } from "./spec";
import type { BracketFormatSpec } from "./types";
import {
  type BracketGameState,
  type BracketGameView,
  type BracketSlotEntry,
  buildBracketView,
} from "./view";

function spec(key: string): BracketFormatSpec {
  const row = BRACKET_FORMAT_SEEDS.find((seed) => seed.key === key);
  if (!row) throw new Error(`missing format ${key}`);
  return row.spec;
}

const FCS = spec("fcs-24-seed16-v2024");

function fullField(count: number): BracketSlotEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1;
    return {
      slotKey: `seed-${seed}`,
      team: {
        schoolId: `school-${seed}`,
        name: `School ${seed}`,
        shortName: `School ${seed}`,
        abbreviation: `S${seed}`,
        slug: `school-${seed}`,
        image: null,
      },
      bidType: seed % 2 === 0 ? "auto" : "at-large",
      bidLabel: null,
    };
  });
}

function final(
  gameKey: string,
  sideAScore: number,
  sideBScore: number,
): BracketGameState {
  return {
    gameKey,
    homeSide: null,
    siteLabel: null,
    kickoffAt: null,
    status: "final",
    sideAScore,
    sideBScore,
    winnerSide: sideAScore > sideBScore ? "a" : "b",
  };
}

function allGames(
  view: ReturnType<typeof buildBracketView>,
): BracketGameView[] {
  return [
    ...view.left.columns.flatMap((column) => column.games),
    ...view.right.columns.flatMap((column) => column.games),
    view.final,
  ];
}

describe("buildBracketView", () => {
  it("splits FCS into two halves of four rounds around the final", () => {
    const view = buildBracketView(FCS, fullField(24), []);
    for (const half of [view.left, view.right]) {
      expect(half.rows).toBe(4);
      expect(half.columns.map((column) => column.roundKey)).toEqual([
        "first",
        "second",
        "quarterfinal",
        "semifinal",
      ]);
      expect(half.columns.map((column) => column.games.length)).toEqual([
        4, 4, 2, 1,
      ]);
    }
    expect(view.final.key).toBe("final");
    expect(view.champion).toBeNull();
  });

  it("places all 24 teams once, with seeds 1-8 entering on a bye", () => {
    const view = buildBracketView(FCS, fullField(24), []);
    const placed = allGames(view)
      .flatMap((game) => [game.sideA, game.sideB])
      .filter((side) => side.team);
    expect(placed).toHaveLength(24);
    expect(new Set(placed.map((side) => side.team?.schoolId)).size).toBe(24);

    const byes = placed.filter((side) => side.byeEntry);
    expect(byes.map((side) => side.seed).sort((a, b) => a! - b!)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("lines each first-round game up with the bye game it feeds", () => {
    const view = buildBracketView(FCS, fullField(24), []);
    const [first, second] = view.left.columns;
    for (const [index, game] of second!.games.entries()) {
      expect(first!.games[index]!.row).toBe(game.row);
      expect(game.span).toBe(1);
      expect(game.fedSides).toEqual(["b"]);
    }
    const [semi] = view.left.columns.slice(-1);
    expect(semi!.games[0]).toMatchObject({ row: 0, span: 4 });
  });

  it("shows placeholders until a feeder game is final", () => {
    const view = buildBracketView(FCS, fullField(24), []);
    const r2 = allGames(view).find((game) => game.key === "r2-1")!;
    expect(r2.sideA.team?.schoolId).toBe("school-1");
    expect(r2.sideB.team).toBeNull();
    expect(r2.sideB.placeholder).toBe("Winner: S16 / S24");

    const qf = allGames(view).find((game) => game.key === "qf-1")!;
    expect(qf.sideA.placeholder).toBe("TBD");
  });

  it("moves winners forward and crowns a champion", () => {
    const view = buildBracketView(FCS, fullField(24), [
      final("r1-16", 10, 31),
      final("r2-1", 42, 7),
      final("r2-8", 14, 21),
      final("qf-1", 28, 24),
      final("sf-1", 35, 17),
      final("final", 20, 13),
    ]);
    const games = allGames(view);
    const r2 = games.find((game) => game.key === "r2-1")!;
    expect(r2.sideB.team?.schoolId).toBe("school-24");
    expect(r2.sideB.seed).toBe(24);
    expect(r2.sideB.showSeed).toBe(false);
    expect(r2.sideA.isWinner).toBe(true);
    expect(r2.sideB.isLoser).toBe(true);

    const qf = games.find((game) => game.key === "qf-1")!;
    expect(qf.sideA.team?.schoolId).toBe("school-1");
    expect(view.final.sideA.team?.schoolId).toBe("school-1");
    expect(view.champion?.schoolId).toBe("school-1");
  });

  it("hosts the higher seed unless overridden, and keeps the final neutral", () => {
    const view = buildBracketView(FCS, fullField(24), [
      {
        gameKey: "r2-2",
        homeSide: "b",
        siteLabel: "Neutral site",
        kickoffAt: null,
        status: "scheduled",
        sideAScore: null,
        sideBScore: null,
        winnerSide: null,
      },
    ]);
    const games = allGames(view);
    const r1 = games.find((game) => game.key === "r1-9")!;
    expect(r1.sideA.isHome).toBe(true);
    expect(r1.sideB.isHome).toBe(false);

    const r2 = games.find((game) => game.key === "r2-2")!;
    expect(r2.sideB.isHome).toBe(true);
    expect(r2.siteLabel).toBe("Neutral site");

    expect(view.final.neutral).toBe(true);
    expect(view.final.sideA.isHome || view.final.sideB.isHome).toBe(false);
  });

  it("hosts a bye seed before its opponent is known", () => {
    const view = buildBracketView(FCS, fullField(24), []);
    const games = allGames(view);
    const r2 = games.find((game) => game.key === "r2-1")!;
    expect(r2.sideA.isHome).toBe(true);
    expect(r2.feeders).toEqual({ b: "r1-16" });
    // Quarterfinal sides are both undecided: no host yet.
    const qf = games.find((game) => game.key === "qf-1")!;
    expect(qf.sideA.isHome || qf.sideB.isHome).toBe(false);
  });

  it("renders an empty edition", () => {
    const view = buildBracketView(FCS, [], []);
    const r1 = allGames(view).find((game) => game.key === "r1-16")!;
    expect(r1.sideA.placeholder).toBe("No. 16 seed");
    expect(r1.sideB.placeholder).toBe("TBD");
  });

  it("builds the CFP 12-team format", () => {
    const view = buildBracketView(
      spec("cfp-12-straight-v2025"),
      fullField(12),
      [],
    );
    expect(view.left.columns.map((column) => column.roundKey)).toEqual([
      "first",
      "quarterfinal",
      "semifinal",
    ]);
    expect(view.left.rows).toBe(2);
  });
});
