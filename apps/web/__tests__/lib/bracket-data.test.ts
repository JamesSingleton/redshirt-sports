import {
  bracketEdition,
  bracketSlots,
  FCS_SPEC,
} from "@/__tests__/helpers/bracket-fixtures";

const db = vi.hoisted(() => ({
  getBracketEdition: vi.fn(),
  getBracketTeamStats: vi.fn(),
  getPublishedBracketEditions: vi.fn(),
  listPublishedBracketSeasons: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => db);
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import {
  bracketEditionLabel,
  bracketEditionPath,
  bracketPaths,
  getCachedBracketSeasons,
  getCachedBracketTeamStats,
  getCachedPublishedBracket,
  loadBracketPage,
  loadLatestBracketPage,
  parseProjectionWeek,
} from "@/lib/bracket-data";

const week7 = bracketEdition();
const week6 = bracketEdition({ id: "edition-6", weekNumber: 6 });
const official = bracketEdition({
  id: "official",
  kind: "official",
  weekId: null,
  weekNumber: null,
});

function detail(edition = week7) {
  return { edition, spec: FCS_SPEC, slots: bracketSlots(), games: [] };
}

describe("bracket data", () => {
  beforeEach(() => {
    db.getBracketEdition
      .mockReset()
      .mockImplementation(async (id: string) =>
        detail([week7, week6, official].find((row) => row.id === id) ?? week7),
      );
    db.listPublishedBracketSeasons.mockReset().mockResolvedValue([2026]);
    db.getBracketTeamStats.mockReset().mockResolvedValue({
      asOf: { pollWeek: 7, ratingsWeek: 7, ratingsPoolSize: 128 },
      teams: {},
    });
    db.getPublishedBracketEditions
      .mockReset()
      .mockResolvedValue({ official: null, projections: [week7, week6] });
  });

  it("builds paths and labels", () => {
    expect(bracketPaths("football", "fcs").projection(2026, 7)).toBe(
      "/college/football/playoffs/fcs/2026/projections/week-7",
    );
    expect(bracketEditionPath(week7)).toBe(
      "/college/football/playoffs/fcs/2026/projections/week-7",
    );
    expect(bracketEditionPath(official)).toBe(
      "/college/football/playoffs/fcs/2026",
    );
    expect(
      bracketEditionPath(
        bracketEdition({ divisionSlug: null, weekNumber: null }),
      ),
    ).toBe("/college/football/playoffs//2026");
    expect(bracketEditionLabel(week7)).toBe("Projection after Week 7");
    expect(bracketEditionLabel(official)).toBe("Official bracket");
  });

  it("falls back to empty stats when the edition is gone", async () => {
    db.getBracketTeamStats.mockResolvedValueOnce(null);
    await expect(
      getCachedBracketTeamStats("gone", "football", "fcs"),
    ).resolves.toEqual({
      asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
      teams: {},
    });
  });

  it("parses projection week segments", () => {
    expect(parseProjectionWeek("week-7")).toBe(7);
    expect(parseProjectionWeek("7")).toBeNull();
  });

  it("lists published seasons", async () => {
    db.listPublishedBracketSeasons.mockResolvedValue([2026, 2025]);
    await expect(getCachedBracketSeasons("football", "fcs")).resolves.toEqual([
      2026, 2025,
    ]);
    expect(db.listPublishedBracketSeasons).toHaveBeenCalledWith({
      sportSlug: "football",
      divisionSlug: "fcs",
    });
  });

  it("never renders a draft or a missing edition", async () => {
    db.getBracketEdition.mockResolvedValueOnce(
      detail(bracketEdition({ status: "draft" })),
    );
    await expect(getCachedPublishedBracket("edition-1")).resolves.toBeNull();
    db.getBracketEdition.mockResolvedValueOnce(null);
    await expect(getCachedPublishedBracket("gone")).resolves.toBeNull();
  });

  it("shows the newest projection until the official bracket is published", async () => {
    const model = await loadBracketPage({
      sport: "football",
      division: "fcs",
      year: "2026",
    });
    expect(model.edition.id).toBe("edition-1");
    expect(model.view.final.key).toBe("final");
    expect(model.projections).toHaveLength(2);
    expect(model.stats.asOf.pollWeek).toBe(7);

    db.getPublishedBracketEditions.mockResolvedValue({
      official,
      projections: [week7],
    });
    await expect(
      loadBracketPage({ sport: "football", division: "fcs", year: "2026" }),
    ).resolves.toMatchObject({ edition: { id: "official" } });
  });

  it("lands on the newest season's current bracket", async () => {
    db.listPublishedBracketSeasons.mockResolvedValue([2026, 2025]);
    const model = await loadLatestBracketPage({
      sport: "football",
      division: "fcs",
    });
    expect(model.edition.id).toBe("edition-1");
    expect(model.seasons).toEqual([2026, 2025]);
    expect(db.getPublishedBracketEditions).toHaveBeenCalledWith({
      sportSlug: "football",
      divisionSlug: "fcs",
      year: 2026,
    });
  });

  it("404s the landing page before any bracket is published", async () => {
    db.listPublishedBracketSeasons.mockResolvedValue([]);
    await expect(
      loadLatestBracketPage({ sport: "football", division: "fcs" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("loads one week's projection", async () => {
    await expect(
      loadBracketPage({
        sport: "football",
        division: "fcs",
        year: "2026",
        week: "week-6",
      }),
    ).resolves.toMatchObject({ edition: { id: "edition-6" } });
  });

  it("404s a bad year, an unpublished week, an empty season, or a lost edition", async () => {
    const load = (input: { year: string; week?: string }) =>
      loadBracketPage({ sport: "football", division: "fcs", ...input });
    await expect(load({ year: "twenty" })).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(load({ year: "2026", week: "week-9" })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    db.getBracketEdition.mockResolvedValueOnce(null);
    await expect(load({ year: "2026" })).rejects.toThrow("NEXT_NOT_FOUND");
    db.getPublishedBracketEditions.mockResolvedValue({
      official: null,
      projections: [],
    });
    await expect(load({ year: "2026" })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
