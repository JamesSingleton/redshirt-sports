import {
  BRACKET_FORMAT_SEEDS,
  type BracketFormatSpec,
} from "@redshirt-sports/db/playoff-bracket";

import { bracketSlots, FCS_SPEC } from "@/__tests__/helpers/bracket-fixtures";
import {
  BRACKET_TITLE_MAX,
  blankDraft,
  bracketBuilderName,
  bracketBuilderSourceLabel,
  bracketDraftStorageKey,
  bracketExportFilename,
  bracketTeamName,
  clearPicks,
  draftAnalytics,
  draftToView,
  isBlankDraft,
  parseStoredDraft,
  pickWinner,
  placeSchool,
  printZoom,
  seedDraft,
  setDraftTitle,
  slotsBySide,
} from "@/lib/bracket-builder";

const KEY = "fcs-24-seed16-v2024";
const FBS_SPEC = BRACKET_FORMAT_SEEDS.find(
  (row) => row.key === "cfp-12-straight-v2025",
)!.spec;
const schools = new Map(
  bracketSlots().map((slot) => [slot.team.schoolId, slot.team]),
);
const seeded = () => seedDraft(KEY, FCS_SPEC, bracketSlots());

/** The game a game's winner goes to, and on which side. */
function next(spec: BracketFormatSpec, gameKey: string) {
  for (const game of spec.games) {
    if ("fromGameKey" in game.sideA && game.sideA.fromGameKey === gameKey) {
      return { key: game.key, side: "a" as const };
    }
    if ("fromGameKey" in game.sideB && game.sideB.fromGameKey === gameKey) {
      return { key: game.key, side: "b" as const };
    }
  }
  throw new Error(`${gameKey} feeds nothing`);
}

describe("bracket builder drafts", () => {
  it("names its storage, title and file after the bracket", () => {
    expect(bracketDraftStorageKey("football", "fcs", KEY)).toBe(
      `redshirt:bracket-builder:football:fcs:${KEY}`,
    );
    expect(bracketBuilderName("fcs", 2026)).toBe("2026 FCS Playoff Bracket");
    expect(bracketExportFilename("fcs", 2026)).toBe(
      "redshirt-sports-fcs-playoff-bracket-2026.png",
    );
    const team = bracketSlots(1)[0]!.team;
    expect(bracketTeamName(team)).toBe("School 1");
    expect(bracketTeamName({ ...team, shortName: null })).toBe(
      "School 1 University",
    );
    expect(
      bracketBuilderSourceLabel({ kind: "official", weekNumber: null }),
    ).toBe("official bracket");
    expect(
      bracketBuilderSourceLabel({ kind: "projection", weekNumber: 10 }),
    ).toBe("Week 10 projection");
  });

  it("starts blank or from a published field", () => {
    const blank = blankDraft(KEY);
    expect(blank).toEqual({ formatKey: KEY, title: "", slots: {}, picks: {} });
    expect(isBlankDraft(blank)).toBe(true);

    const extra = { ...bracketSlots(1)[0]!, slotKey: "not-a-slot" };
    const draft = seedDraft(KEY, FCS_SPEC, [...bracketSlots(), extra]);
    expect(Object.keys(draft.slots)).toHaveLength(24);
    expect(draft.slots["seed-5"]).toBe("school-5");
    expect(draft.picks).toEqual({});
    expect(isBlankDraft(draft)).toBe(false);
    expect(isBlankDraft({ ...blank, picks: { final: "a" } })).toBe(false);
  });

  it("keeps a title within the limit", () => {
    const long = "x".repeat(BRACKET_TITLE_MAX + 10);
    expect(setDraftTitle(blankDraft(KEY), long).title).toHaveLength(
      BRACKET_TITLE_MAX,
    );
  });

  it("places, swaps and removes schools", () => {
    let draft = placeSchool(FCS_SPEC, blankDraft(KEY), "seed-1", "school-1");
    expect(draft.slots).toEqual({ "seed-1": "school-1" });

    // Moving a placed school into an empty slot empties where it was.
    draft = placeSchool(FCS_SPEC, draft, "seed-2", "school-1");
    expect(draft.slots).toEqual({ "seed-2": "school-1" });

    // Placing a school that is already in the field swaps the two slots.
    draft = placeSchool(FCS_SPEC, draft, "seed-1", "school-9");
    draft = placeSchool(FCS_SPEC, draft, "seed-1", "school-1");
    expect(draft.slots).toEqual({
      "seed-1": "school-1",
      "seed-2": "school-9",
    });

    draft = placeSchool(FCS_SPEC, draft, "seed-2", null);
    expect(draft.slots).toEqual({ "seed-1": "school-1" });
  });

  it("advances a pick, takes it back, and clears what depended on it", () => {
    const first = FCS_SPEC.games.find((game) => game.key === "r1-16")!;
    const second = next(FCS_SPEC, first.key);
    const quarter = next(FCS_SPEC, second.key);
    const semi = next(FCS_SPEC, quarter.key);
    const other = second.side === "a" ? "b" : "a";

    // A full bracket, then the first-round winner sent on to the semifinal.
    let draft = seeded();
    for (const game of FCS_SPEC.games) {
      draft = pickWinner(FCS_SPEC, draft, game.key, "a");
    }
    for (const step of [second, quarter, semi]) {
      if (draft.picks[step.key] !== step.side) {
        draft = pickWinner(FCS_SPEC, draft, step.key, step.side);
      }
    }
    expect(draft.picks).toMatchObject({
      [first.key]: "a",
      [second.key]: second.side,
      [quarter.key]: quarter.side,
      [semi.key]: semi.side,
    });

    // The other team wins the first game: its old winner is out everywhere,
    // and picks that never involved it stay.
    draft = pickWinner(FCS_SPEC, draft, first.key, "b");
    expect(draft.picks[first.key]).toBe("b");
    expect(draft.picks[second.key]).toBeUndefined();
    expect(draft.picks[quarter.key]).toBeUndefined();
    expect(draft.picks[semi.key]).toBeUndefined();
    expect(Object.keys(draft.picks).length).toBeGreaterThan(10);

    // A later pick for the team that did not come from this game survives.
    draft = pickWinner(FCS_SPEC, draft, second.key, other);
    draft = pickWinner(FCS_SPEC, draft, first.key, "a");
    expect(draft.picks).toMatchObject({
      [first.key]: "a",
      [second.key]: other,
    });

    // Taking a pick back leaves the next game without an opponent, so its
    // pick goes too.
    draft = pickWinner(FCS_SPEC, draft, first.key, "a");
    expect(draft.picks[first.key]).toBeUndefined();
    expect(draft.picks[second.key]).toBeUndefined();
    expect(clearPicks(draft).picks).toEqual({});
  });

  it("only takes a pick when both teams are there", () => {
    let draft = placeSchool(FCS_SPEC, blankDraft(KEY), "seed-16", "school-16");
    draft = pickWinner(FCS_SPEC, draft, "r1-16", "a");
    expect(draft.picks).toEqual({});

    draft = placeSchool(FCS_SPEC, draft, "seed-24", "school-24");
    draft = pickWinner(FCS_SPEC, draft, "r1-16", "a");
    expect(draft.picks).toEqual({ "r1-16": "a" });
  });

  it("drops picks for a team whose slot is emptied", () => {
    const first = FCS_SPEC.games.find((game) => game.key === "r1-16")!;
    const slotKey = "slotKey" in first.sideA ? first.sideA.slotKey : "";
    const second = next(FCS_SPEC, first.key);
    let draft = pickWinner(FCS_SPEC, seeded(), first.key, "a");
    draft = pickWinner(FCS_SPEC, draft, second.key, second.side);

    draft = placeSchool(FCS_SPEC, draft, slotKey, null);
    expect(draft.picks).toEqual({});
  });

  it("lays a draft out with its picks advanced and no game marked final", () => {
    let draft = seeded();
    draft = { ...draft, slots: { ...draft.slots, "seed-1": "gone" } };
    // Pick the lower side of every game, in round order.
    for (const game of FCS_SPEC.games) {
      draft = pickWinner(FCS_SPEC, draft, game.key, "b");
    }
    const view = draftToView(FCS_SPEC, draft, schools);
    expect(view.champion).not.toBeNull();
    expect(view.final.status).toBe("scheduled");
    expect(view.final.sideA.isWinner || view.final.sideB.isWinner).toBe(true);
    const games = [...view.left.columns, ...view.right.columns].flatMap(
      (column) => column.games,
    );
    expect(games.every((game) => game.status === "scheduled")).toBe(true);
    // A school that is no longer offered leaves its slot open.
    expect(
      games.flatMap((game) => [game.sideA, game.sideB]).map((s) => s.team),
    ).not.toContainEqual(expect.objectContaining({ schoolId: "gone" }));
  });

  it("reads a saved draft back and drops what no longer fits", () => {
    const parse = (value: unknown) =>
      parseStoredDraft(
        typeof value === "string" ? value : JSON.stringify(value),
        KEY,
        FCS_SPEC,
        schools,
      );
    expect(parseStoredDraft(null, KEY, FCS_SPEC, schools)).toBeNull();
    expect(parse("{not json")).toBeNull();
    expect(parse(3)).toBeNull();
    expect(parse(null)).toBeNull();
    expect(parse([])).toBeNull();
    expect(parse({ formatKey: "another-format" })).toBeNull();
    expect(parse({ formatKey: KEY, slots: [], picks: "x", title: 4 })).toEqual(
      blankDraft(KEY),
    );

    expect(
      parse({
        formatKey: KEY,
        title: "y".repeat(BRACKET_TITLE_MAX + 5),
        slots: {
          "seed-16": "school-16",
          "seed-24": "school-24",
          "seed-1": "school-16", // listed twice
          "seed-2": "left-the-list",
          "seed-3": 7,
          "seed-99": "school-3",
        },
        picks: {
          "r1-16": "a",
          "r1-9": "a", // nobody in that slot
          "r1-12": "c",
          "not-a-game": "a",
        },
      }),
    ).toEqual({
      formatKey: KEY,
      title: "y".repeat(BRACKET_TITLE_MAX),
      slots: { "seed-16": "school-16", "seed-24": "school-24" },
      picks: { "r1-16": "a" },
    });
  });

  it("describes the slot behind each row that takes a team", () => {
    const fcs = slotsBySide(FCS_SPEC);
    expect(fcs.size).toBe(24);
    const labels = [...fcs.values()].map((slot) => slot.label);
    expect(labels).toContain("No. 1 seed");
    expect(labels).toContain("team playing the No. 16 seed");
    expect(fcs.get("r1-16:a") ?? fcs.get("r1-16:b")).toBeDefined();
    expect(
      [...fcs.values()].find((slot) => slot.slotKey === "seed-24"),
    ).toEqual({ slotKey: "seed-24", seed: null, label: expect.any(String) });
    expect(slotsBySide(FBS_SPEC).size).toBe(12);

    // A format that seeds nobody has nothing to name a slot by.
    const unseeded: BracketFormatSpec = {
      fieldSize: 2,
      rounds: [{ key: "final", label: "Final" }],
      slots: [
        { key: "x", seed: null, region: null, showSeed: false },
        { key: "y", seed: 2, region: null, showSeed: false },
      ],
      games: [
        {
          key: "final",
          roundKey: "final",
          roundLabel: "Final",
          host: "neutral",
          sideA: { slotKey: "x" },
          sideB: { slotKey: "missing" },
        },
      ],
    };
    expect([...slotsBySide(unseeded).values()]).toEqual([
      { slotKey: "x", seed: null, label: "unseeded team" },
      { slotKey: "missing", seed: null, label: "unseeded team" },
    ]);
  });

  it("shrinks a bracket to one landscape page, never enlarging it", () => {
    expect(printZoom(0, 0)).toBe(1);
    expect(printZoom(500, 0)).toBe(1);
    expect(printZoom(500, 400)).toBe(1);
    expect(printZoom(1950, 400)).toBe(0.5);
    expect(printZoom(900, 1430)).toBe(0.5);
  });

  it("summarises a draft for analytics", () => {
    const draft = setDraftTitle(
      pickWinner(FCS_SPEC, seeded(), "r1-16", "a"),
      " Mine ",
    );
    expect(
      draftAnalytics(draft, { sport: "football", division: "fcs", year: 2026 }),
    ).toEqual({
      sport: "football",
      division: "fcs",
      year: 2026,
      format_key: KEY,
      teams_placed: 24,
      picks_made: 1,
      has_title: true,
    });
  });
});
