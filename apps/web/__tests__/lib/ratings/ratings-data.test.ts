import { weekModel } from "@/__tests__/helpers/ratings-fixtures";

const db = vi.hoisted(() => ({
  getPublicPool: vi.fn(),
  getPublishedRun: vi.fn(),
  listPoolPredictions: vi.fn(),
  listPublicPools: vi.fn(),
  listPublishedWeeks: vi.fn(),
}));

vi.mock("@redshirt-sports/db/ratings", async () => {
  const { parseRatingWeekSegment } = await vi.importActual<
    typeof import("@redshirt-sports/db/ratings/segments")
  >("@redshirt-sports/db/ratings/segments");
  return { ...db, parseRatingWeekSegment };
});
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import {
  getCachedPredictions,
  getCachedPublicPools,
  loadRatingsSeason,
  loadRatingsSeasonRuns,
  loadRatingsTeam,
  loadRatingsWeek,
  requirePool,
} from "@/lib/ratings/data";

const model = weekModel();

describe("ratings data", () => {
  beforeEach(() => {
    db.getPublicPool.mockReset().mockResolvedValue(model.pool);
    db.listPublishedWeeks.mockReset().mockResolvedValue(model.weeks);
    db.getPublishedRun
      .mockReset()
      .mockResolvedValue({ run: model.run, rows: model.rows });
    db.listPublicPools.mockReset().mockResolvedValue([model.pool]);
  });

  it("loads a pool's predictions", async () => {
    db.listPoolPredictions.mockResolvedValue([]);
    await expect(
      getCachedPredictions("football", "fcs", "pool-1"),
    ).resolves.toEqual([]);
    expect(db.listPoolPredictions).toHaveBeenCalledWith("pool-1");
  });

  it("lists public pools", async () => {
    await expect(getCachedPublicPools()).resolves.toEqual([model.pool]);
  });

  it("404s a pool that isn't public", async () => {
    db.getPublicPool.mockResolvedValue(null);
    await expect(requirePool("football", "fbs")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("loads the latest week when no week is given", async () => {
    const loaded = await loadRatingsWeek({ sport: "football", pool: "fcs" });
    expect(loaded.week.runId).toBe("run-post");
    expect(loaded.isLatest).toBe(true);
    expect(db.getPublishedRun).toHaveBeenCalledWith("run-post");
  });

  it("finds an archived regular-season week and the postseason", async () => {
    const week16 = await loadRatingsWeek({
      sport: "football",
      pool: "fcs",
      year: "2025",
      week: "16",
    });
    expect(week16.week.runId).toBe("run-16");
    expect(week16.isLatest).toBe(false);
    const post = await loadRatingsWeek({
      sport: "football",
      pool: "fcs",
      year: "2024",
      week: "postseason",
    });
    expect(post.week.runId).toBe("run-2024");
  });

  it("404s a malformed or unpublished week, an empty pool, or a missing run", async () => {
    await expect(
      loadRatingsWeek({
        sport: "football",
        pool: "fcs",
        year: "2025",
        week: "week-16",
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      loadRatingsWeek({
        sport: "football",
        pool: "fcs",
        year: "2025",
        week: "3",
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    db.getPublishedRun.mockResolvedValueOnce(null);
    await expect(
      loadRatingsWeek({ sport: "football", pool: "fcs" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    db.listPublishedWeeks.mockResolvedValueOnce([]);
    await expect(
      loadRatingsWeek({ sport: "football", pool: "fcs" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("loads one team by slug, or 404s", async () => {
    const { row } = await loadRatingsTeam({
      sport: "football",
      pool: "fcs",
      slug: "montana-state-bobcats",
    });
    expect(row.name).toBe("Montana State");
    await expect(
      loadRatingsTeam({ sport: "football", pool: "fcs", slug: "nobody" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("loads a season oldest-first with every year, or 404s", async () => {
    const season = await loadRatingsSeason({
      sport: "football",
      pool: "fcs",
      year: "2025",
    });
    expect(season.weeks.map((w) => w.segment)).toEqual(["16", "postseason"]);
    expect(season.years).toEqual([2025, 2024]);
    await expect(
      loadRatingsSeason({ sport: "football", pool: "fcs", year: "2019" }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("loads every published week of a season with its table, skipping unreadable runs", async () => {
    db.getPublishedRun.mockImplementation(async (runId: string) =>
      runId === "run-16" ? null : { run: model.run, rows: model.rows },
    );
    const season = await loadRatingsSeasonRuns({
      sport: "football",
      pool: "fcs",
      year: "2025",
    });
    expect(season.weeks.map((w) => w.week.segment)).toEqual(["postseason"]);
    expect(season.weeks[0]?.rows).toHaveLength(3);
  });
});
