import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { bracketEditionsTable } from "../schema";
import { emptyBracket } from "./empty-bracket";
import { BRACKET_FORMAT_SEEDS, resolveFormat } from "./spec";
import type { BracketFormatSeed, SkeletonGame } from "./types";

function seedOf(slotKey: string | null): number | null {
  if (!slotKey?.startsWith("seed-")) return null;
  return Number(slotKey.slice("seed-".length));
}

function gameTouchesSeed(game: SkeletonGame, seed: number): boolean {
  return (
    seedOf(game.sideASlotKey) === seed || seedOf(game.sideBSlotKey) === seed
  );
}

function formatByKey(key: string): BracketFormatSeed {
  const row = BRACKET_FORMAT_SEEDS.find((seed) => seed.key === key);
  if (!row) throw new Error(`missing format ${key}`);
  return row;
}

describe("emptyBracket", () => {
  it("does not assign a school", () => {
    for (const row of BRACKET_FORMAT_SEEDS) {
      const skeleton = emptyBracket(row.spec);
      expect(skeleton.slots.every((slot) => slot.schoolId === null)).toBe(true);
      expect(skeleton.slots).toHaveLength(row.spec.fieldSize);
    }
  });

  it("builds the FCS 24-team tree", () => {
    const skeleton = emptyBracket(formatByKey("fcs-24-seed16-v2024").spec);
    expect(skeleton.slots).toHaveLength(24);

    for (let seed = 17; seed <= 24; seed += 1) {
      const slot = skeleton.slots.find((item) => item.seed === seed);
      expect(slot?.showSeed).toBe(false);
    }
    for (let seed = 1; seed <= 16; seed += 1) {
      const slot = skeleton.slots.find((item) => item.seed === seed);
      expect(slot?.showSeed).toBe(true);
    }

    const firstRound = skeleton.games.filter(
      (game) => game.roundKey === "first",
    );
    expect(firstRound).toHaveLength(8);
    for (let seed = 1; seed <= 8; seed += 1) {
      expect(firstRound.some((game) => gameTouchesSeed(game, seed))).toBe(
        false,
      );
      const second = skeleton.games.find(
        (game) => game.roundKey === "second" && gameTouchesSeed(game, seed),
      );
      expect(second?.sideAFromGameKey).toBeNull();
      expect(second?.sideASlotKey).toBe(`seed-${seed}`);
      expect(second?.sideBFromGameKey).not.toBeNull();
    }

    for (const game of skeleton.games) {
      if (game.gameKey === "final") {
        expect(game.host).toBe("neutral");
      } else {
        expect(game.host).toBe("higherSeed");
      }
    }

    const visitors = [24, 23, 22, 21, 20, 19, 18, 17];
    const hosts = [16, 15, 14, 13, 12, 11, 10, 9];
    for (let index = 0; index < hosts.length; index += 1) {
      const game = skeleton.games.find(
        (item) => item.gameKey === `r1-${hosts[index]}`,
      );
      expect(seedOf(game?.sideASlotKey ?? null)).toBe(hosts[index]);
      expect(seedOf(game?.sideBSlotKey ?? null)).toBe(visitors[index]);
    }
  });

  it("builds the 12-team CFP tree", () => {
    const skeleton = emptyBracket(formatByKey("cfp-12-straight-v2025").spec);
    expect(
      skeleton.slots.filter((slot) => slot.seed !== null && slot.seed <= 4),
    ).toHaveLength(4);

    const firstRound = skeleton.games.filter(
      (game) => game.roundKey === "first",
    );
    expect(
      firstRound.map((game) => [
        seedOf(game.sideASlotKey),
        seedOf(game.sideBSlotKey),
      ]),
    ).toEqual([
      [8, 9],
      [5, 12],
      [7, 10],
      [6, 11],
    ]);

    for (let seed = 1; seed <= 4; seed += 1) {
      expect(firstRound.some((game) => gameTouchesSeed(game, seed))).toBe(
        false,
      );
      const quarter = skeleton.games.find(
        (game) =>
          game.roundKey === "quarterfinal" && gameTouchesSeed(game, seed),
      );
      expect(quarter?.sideAFromGameKey).toBeNull();
      expect(quarter?.sideASlotKey).toBe(`seed-${seed}`);
    }

    for (const game of skeleton.games.filter(
      (item) => item.roundKey === "quarterfinal",
    )) {
      expect(game.host).toBe("neutral");
    }
    for (const game of firstRound) {
      expect(game.host).toBe("higherSeed");
    }
  });

  it("builds the 68-team and 76-team basketball trees", () => {
    const sixtyEight = formatByKey("ncaa-mbb-68-v2011").spec;
    const seventySix = formatByKey("ncaa-mbb-76-v2027").spec;
    expect(sixtyEight.fieldSize).toBe(68);
    expect(seventySix.fieldSize).toBe(76);

    const sixtyEightGames = emptyBracket(sixtyEight).games;
    const seventySixGames = emptyBracket(seventySix).games;

    expect(
      sixtyEightGames.filter((game) => game.roundKey === "play-in"),
    ).toHaveLength(4);
    expect(
      sixtyEightGames.filter((game) => game.roundKey !== "play-in"),
    ).toHaveLength(63);

    const opening = seventySixGames.filter(
      (game) => game.roundKey === "opening",
    );
    expect(opening).toHaveLength(12);
    expect(
      seventySixGames.filter((game) => game.roundKey !== "opening"),
    ).toHaveLength(63);

    const fills = opening.map((game) => game.gameKey.replace(/^opening-/, ""));
    expect(new Set(fills).size).toBe(12);
    for (const game of opening) {
      const referenced = seventySixGames.filter(
        (item) =>
          item.sideAFromGameKey === game.gameKey ||
          item.sideBFromGameKey === game.gameKey,
      );
      expect(referenced).toHaveLength(1);
      expect(referenced[0]?.roundKey).toBe("round-of-64");
    }

    expect(formatByKey("ncaa-wbb-68-v2022").spec.games).toHaveLength(
      sixtyEight.games.length,
    );
    expect(formatByKey("ncaa-wbb-76-v2027").spec.fieldSize).toBe(76);
  });
});

describe("resolveFormat", () => {
  it("uses the 68-team row in 2026 and the 76-team row in 2027", () => {
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "mens-basketball",
        divisionSlug: null,
        year: 2026,
      }).key,
    ).toBe("ncaa-mbb-68-v2011");
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "womens-basketball",
        divisionSlug: null,
        year: 2026,
      }).key,
    ).toBe("ncaa-wbb-68-v2022");
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "mens-basketball",
        divisionSlug: null,
        year: 2027,
      }).key,
    ).toBe("ncaa-mbb-76-v2027");
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "womens-basketball",
        divisionSlug: null,
        year: 2027,
      }).key,
    ).toBe("ncaa-wbb-76-v2027");
  });

  it("throws when two ranges match", () => {
    const overlap: BracketFormatSeed = {
      ...formatByKey("ncaa-mbb-68-v2011"),
      key: "ncaa-mbb-overlap",
      effectiveFromYear: 2020,
      effectiveToYear: 2026,
    };
    expect(() =>
      resolveFormat([...BRACKET_FORMAT_SEEDS, overlap], {
        sportSlug: "mens-basketball",
        divisionSlug: null,
        year: 2026,
      }),
    ).toThrow(/found 2/);
  });

  it("throws when no range matches", () => {
    expect(() =>
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "mens-basketball",
        divisionSlug: null,
        year: 2010,
      }),
    ).toThrow(/found 0/);
  });

  it("keeps football formats on their divisions", () => {
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "football",
        divisionSlug: "fcs",
        year: 2026,
      }).key,
    ).toBe("fcs-24-seed16-v2024");
    expect(
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "football",
        divisionSlug: "fbs",
        year: 2026,
      }).key,
    ).toBe("cfp-12-straight-v2025");
  });
});

describe("bracket_editions.source_week_id", () => {
  it("is not null", () => {
    const column = getTableConfig(bracketEditionsTable).columns.find(
      (item) => item.name === "source_week_id",
    );
    expect(column?.notNull).toBe(true);
  });
});

describe("0023_playoff_bracket.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "../../apps/web/supabase/migrations/0023_playoff_bracket.sql",
    ),
    "utf8",
  );

  it("seeds the same format specs the resolver uses", () => {
    const seeded = [
      ...sql.matchAll(
        /'([^']+)',\s*(\d+),\s*(NULL|\d+),\s*\$spec\$([\s\S]*?)\$spec\$::jsonb/g,
      ),
    ].map((match) => ({
      key: match[1],
      effectiveFromYear: Number(match[2]),
      effectiveToYear: match[3] === "NULL" ? null : Number(match[3]),
      spec: JSON.parse(match[4] ?? ""),
    }));

    expect(seeded.map((row) => row.key)).toEqual(
      BRACKET_FORMAT_SEEDS.map((row) => row.key),
    );
    for (const row of BRACKET_FORMAT_SEEDS) {
      const match = seeded.find((item) => item.key === row.key);
      expect(match?.effectiveFromYear).toBe(row.effectiveFromYear);
      expect(match?.effectiveToYear).toBe(row.effectiveToYear);
      expect(match?.spec).toEqual(row.spec);
    }
  });

  it("enables row level security and does not seed a basketball division", () => {
    for (const table of [
      "bracket_divisions",
      "bracket_formats",
      "bracket_editions",
      "bracket_slots",
      "bracket_games",
    ]) {
      expect(sql).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).not.toContain("'d1'");
    expect(sql).not.toContain("'mid-major'");
    expect(sql).toContain(`"source_week_id" text NOT NULL`);
  });
});
