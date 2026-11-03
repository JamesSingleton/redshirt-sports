import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BRACKET_FORMAT_SEEDS, resolveFormat } from "./spec";
import type { BracketFormatSeed, BracketGameSpec } from "./types";
import { rootGame, validateBracketSpec } from "./validate-spec";

function formatByKey(key: string): BracketFormatSeed {
  const row = BRACKET_FORMAT_SEEDS.find((seed) => seed.key === key);
  if (!row) throw new Error(`missing format ${key}`);
  return row;
}

function slotSeed(game: BracketGameSpec, side: "sideA" | "sideB") {
  const value = game[side];
  if (!("slotKey" in value) || !value.slotKey.startsWith("seed-")) return null;
  return Number(value.slotKey.slice("seed-".length));
}

function migration(name: string): string {
  return readFileSync(
    resolve(process.cwd(), `../../apps/web/supabase/migrations/${name}`),
    "utf8",
  );
}

describe("validateBracketSpec", () => {
  it.each(BRACKET_FORMAT_SEEDS.map((row) => [row.key, row]))(
    "accepts %s",
    (_key, row) => {
      expect(validateBracketSpec(row.spec)).toEqual([]);
    },
  );

  it("reports an unused slot, a dangling feeder and a second root", () => {
    const spec = structuredClone(formatByKey("fcs-24-seed16-v2024").spec);
    spec.games = spec.games.filter((game) => game.key !== "r1-16");
    const errors = validateBracketSpec(spec);
    expect(errors).toContain("slot seed-16 is used 0 times");
    expect(errors).toContain("game r2-1 is fed by unknown game r1-16");
  });
});

describe("FCS 24-team spec", () => {
  const spec = formatByKey("fcs-24-seed16-v2024").spec;

  it("hides seeds 17-24 and shows 1-16", () => {
    for (const slot of spec.slots) {
      expect(slot.showSeed).toBe((slot.seed ?? 99) <= 16);
    }
  });

  it("sends seeds 24-17 to hosts 16-9 and byes seeds 1-8", () => {
    const firstRound = spec.games.filter((game) => game.roundKey === "first");
    expect(
      firstRound.map((game) => [
        slotSeed(game, "sideA"),
        slotSeed(game, "sideB"),
      ]),
    ).toEqual([
      [16, 24],
      [15, 23],
      [14, 22],
      [13, 21],
      [12, 20],
      [11, 19],
      [10, 18],
      [9, 17],
    ]);

    for (let seed = 1; seed <= 8; seed += 1) {
      const second = spec.games.find((game) => game.key === `r2-${seed}`);
      expect(second && slotSeed(second, "sideA")).toBe(seed);
      expect(second && "fromGameKey" in second.sideB).toBe(true);
    }
  });

  it("is hosted by the higher seed until a neutral championship", () => {
    expect(rootGame(spec).key).toBe("final");
    for (const game of spec.games) {
      expect(game.host).toBe(game.key === "final" ? "neutral" : "higherSeed");
    }
  });
});

describe("resolveFormat", () => {
  it("uses the 68-team row in 2026 and the 76-team row in 2027", () => {
    const pick = (sportSlug: BracketFormatSeed["sportSlug"], year: number) =>
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug,
        divisionSlug: null,
        year,
      }).key;
    expect(pick("mens-basketball", 2026)).toBe("ncaa-mbb-68-v2011");
    expect(pick("womens-basketball", 2026)).toBe("ncaa-wbb-68-v2022");
    expect(pick("mens-basketball", 2027)).toBe("ncaa-mbb-76-v2027");
    expect(pick("womens-basketball", 2027)).toBe("ncaa-wbb-76-v2027");
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
    const pick = (divisionSlug: string) =>
      resolveFormat(BRACKET_FORMAT_SEEDS, {
        sportSlug: "football",
        divisionSlug,
        year: 2026,
      }).key;
    expect(pick("fcs")).toBe("fcs-24-seed16-v2024");
    expect(pick("fbs")).toBe("cfp-12-straight-v2025");
  });
});

describe("bracket migrations", () => {
  it("0023 seeds the same format specs the resolver uses", () => {
    const seeded = [
      ...migration("0023_playoff_bracket.sql").matchAll(
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

  it("0026 backfills division_slug before dropping bracket_divisions", () => {
    const sql = migration("0026_playoff_bracket_rework.sql");
    const backfill = sql.indexOf('SET "division_slug" = "division"."slug"');
    const drop = sql.indexOf('DROP TABLE "bracket_divisions"');
    expect(backfill).toBeGreaterThan(-1);
    expect(drop).toBeGreaterThan(backfill);
    expect(sql).toContain("RAISE EXCEPTION");
  });
});
