import { rows, teamRow, weekModel } from "@/__tests__/helpers/ratings-fixtures";
import { formatPct, summarizePredictions } from "@/lib/ratings/accuracy";
import {
  buildRatingsDatasetJsonLd,
  RATINGS_LICENSE_URL,
} from "@/lib/ratings/dataset-json-ld";
import { ratingsCsv, ratingsJson } from "@/lib/ratings/export";
import {
  formatPoints,
  formatRankRange,
  formatRecord,
  formatScore,
  formatSor,
  formatThrough,
  parseSort,
  parseSortDir,
  RATINGS_METHODOLOGY_PATH,
  ratingsPaths,
  siteLabel,
  sortHref,
  sortRows,
} from "@/lib/ratings/format";
import { validationReport } from "@/lib/ratings/validation";

describe("ratings format", () => {
  it("builds every pool path", () => {
    const paths = ratingsPaths("football", "fcs");
    expect(paths.latest).toBe("/college/football/ratings/fcs");
    expect(paths.week(2025, "3")).toBe("/college/football/ratings/fcs/2025/3");
    expect(paths.team("x")).toBe("/college/football/ratings/fcs/teams/x");
    expect(paths.weekTeam(2025, "postseason", "x")).toBe(
      "/college/football/ratings/fcs/2025/postseason/teams/x",
    );
    expect(paths.teamSheets(2025, "3")).toBe(
      "/college/football/ratings/fcs/2025/3/team-sheets",
    );
    expect(paths.data(2025, "3", "json")).toBe(
      "/api/ratings/football/fcs/2025/3?format=json",
    );
    expect(paths.seasonWorkbook(2025)).toBe("/api/ratings/football/fcs/2025");
    expect(paths.accuracy).toBe("/college/football/ratings/fcs/accuracy");
    expect(RATINGS_METHODOLOGY_PATH).toBe("/ratings/methodology");
  });

  it("formats records, scores, SOR, points, ranges, sites, and dates", () => {
    expect(formatRecord({ wins: 9, losses: 2, ties: 0 })).toBe("9-2");
    expect(formatRecord({ wins: 9, losses: 2, ties: 1 })).toBe("9-2-1");
    expect(formatScore(null)).toBe("—");
    expect(formatScore(0.4384)).toBe("43.8");
    expect(formatSor(null)).toBe("—");
    expect(formatSor(0.0004)).toBe("<0.1%");
    expect(formatSor(0.034)).toBe("3.4%");
    expect(formatSor(0.34)).toBe("34%");
    expect(formatPoints(null)).toBe("—");
    expect(formatPoints(3.14)).toBe("+3.1");
    expect(formatPoints(-3.14)).toBe("−3.1");
    expect(formatPoints(0)).toBe("0.0");
    expect(formatPoints(-2, false)).toBe("2.0");
    expect(formatRankRange(null, 3)).toBeNull();
    expect(formatRankRange(2, 2)).toBe("2");
    expect(formatRankRange(2, 9)).toBe("2–9");
    expect(siteLabel("home")).toBe("vs");
    expect(siteLabel("away")).toBe("at");
    expect(siteLabel("neutral")).toBe("vs (N)");
    expect(formatThrough(null)).toBeNull();
    expect(formatThrough("2025-11-02T03:30:00Z")).toBe("Saturday, November 1");
  });

  it("parses sort keys and falls back to SOR", () => {
    expect(parseSort("sos")).toBe("sos");
    expect(parseSort(["power", "sos"])).toBe("power");
    expect(parseSort("bogus")).toBe("sor");
    expect(parseSort(undefined)).toBe("sor");
  });

  it("parses sort direction and falls back to ascending", () => {
    expect(parseSortDir("desc")).toBe("desc");
    expect(parseSortDir(["desc", "asc"])).toBe("desc");
    expect(parseSortDir("sideways")).toBe("asc");
    expect(parseSortDir(undefined)).toBe("asc");
  });

  it("cycles a header link through ascending, descending, and reset", () => {
    expect(sortHref("/b", "sor", { sort: "sor", dir: "asc" })).toBe(
      "/b?sort=sor&dir=desc",
    );
    expect(sortHref("/b", "sor", { sort: "sor", dir: "desc" })).toBe("/b");
    expect(sortHref("/b", "sos", { sort: "sor", dir: "asc" })).toBe(
      "/b?sort=sos",
    );
    expect(sortHref("/b", "sos", { sort: "sos", dir: "asc" })).toBe(
      "/b?sort=sos&dir=desc",
    );
    expect(sortHref("/b", "sos", { sort: "sos", dir: "desc" })).toBe("/b");
    expect(sortHref("/b", "sor", { sort: "sos", dir: "desc" })).toBe("/b");
  });

  it("reverses ranked teams when descending and keeps unranked last", () => {
    const data = [
      teamRow({ schoolId: "u", sorRank: null, remainingSos: null }),
      teamRow({ schoolId: "one", sorRank: 1, remainingSos: 0.2 }),
      teamRow({ schoolId: "two", sorRank: 2, remainingSos: 0.6 }),
    ];
    expect(sortRows(data, "sor", "desc").map((r) => r.schoolId)).toEqual([
      "two",
      "one",
      "u",
    ]);
    expect(sortRows(data, "remaining", "desc").map((r) => r.schoolId)).toEqual([
      "one",
      "two",
      "u",
    ]);
  });

  it("sorts ranked teams first, unranked by power, and remaining SOS by value", () => {
    const data = rows();
    expect(sortRows(data, "sor").map((r) => r.schoolId)).toEqual([
      "msu",
      "ndsu",
      "new",
    ]);
    expect(sortRows(data, "power").map((r) => r.schoolId)).toEqual([
      "msu",
      "ndsu",
      "new",
    ]);
    expect(sortRows(data, "sos").map((r) => r.schoolId)).toEqual([
      "msu",
      "ndsu",
      "new",
    ]);
    expect(sortRows(data, "sov").map((r) => r.schoolId)).toEqual([
      "msu",
      "ndsu",
      "new",
    ]);
    expect(sortRows(data, "record-sos").map((r) => r.schoolId)).toEqual([
      "msu",
      "ndsu",
      "new",
    ]);
    expect(sortRows(data, "remaining").map((r) => r.schoolId)).toEqual([
      "ndsu",
      "new",
      "msu",
    ]);
    // Ties on rank fall back to name; an unranked row before a ranked one moves after it.
    const tied = [
      teamRow({ schoolId: "b", name: "B", sorRank: 1 }),
      teamRow({ schoolId: "a", name: "A", sorRank: 1 }),
    ];
    expect(sortRows(tied, "sor").map((r) => r.name)).toEqual(["A", "B"]);
    const mixed = [
      teamRow({ schoolId: "u", sorRank: null }),
      teamRow({ schoolId: "r", sorRank: 4 }),
    ];
    expect(sortRows(mixed, "sor").map((r) => r.schoolId)).toEqual(["r", "u"]);
    const unranked = [
      teamRow({ schoolId: "y", name: "Y", sorRank: null, powerRank: 5 }),
      teamRow({ schoolId: "x", name: "X", sorRank: null, powerRank: 5 }),
    ];
    expect(sortRows(unranked, "sor").map((r) => r.name)).toEqual(["X", "Y"]);
    const sameRemaining = [
      teamRow({ schoolId: "p2", powerRank: 2, remainingSos: 0.4 }),
      teamRow({ schoolId: "p1", powerRank: 1, remainingSos: 0.4 }),
    ];
    expect(sortRows(sameRemaining, "remaining").map((r) => r.schoolId)).toEqual(
      ["p1", "p2"],
    );
    const noneLeft = [
      teamRow({ schoolId: "n", powerRank: 9, remainingSos: null }),
      teamRow({ schoolId: "s", powerRank: 8, remainingSos: 0.1 }),
      teamRow({ schoolId: "m", powerRank: 7, remainingSos: null }),
    ];
    expect(sortRows(noneLeft, "remaining").map((r) => r.schoolId)).toEqual([
      "s",
      "m",
      "n",
    ]);
  });
});

describe("ratings exports", () => {
  it("writes a licensed CSV with every team in SOR order", () => {
    const csv = ratingsCsv(weekModel(), "https://x.test/r");
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("# source: Redshirt Sports");
    expect(csv).toContain(`# license: ${RATINGS_LICENSE_URL}`);
    expect(csv).toContain("# checksum: abcdef0123456789");
    const header = lines.find((line) => line.startsWith("sor_rank,"));
    expect(header).toBeDefined();
    expect(lines.at(-3)).toMatch(/^1,Montana State,Big Sky,14-1,14-2,/);
    expect(lines.at(-1)).toMatch(/^,Newcomer,,/);
  });

  it("quotes cells with commas or quotes", () => {
    const model = weekModel({ rows: [teamRow({ name: 'Team, "Q"' })] });
    expect(ratingsCsv(model, "u")).toContain('"Team, ""Q"""');
  });

  it("writes JSON with params and explanations but not logos", () => {
    const json = ratingsJson(weekModel(), "https://x.test/r");
    expect(json.attribution).toContain(
      "Redshirt Sports FCS ratings, 2025 Postseason",
    );
    expect(json.params.sigma).toBe(14.6);
    expect(json.teams[0]).not.toHaveProperty("image");
    expect(json.teams[0]?.explanation.games).toHaveLength(3);
  });

  it("describes the week as a schema.org Dataset", () => {
    const ld = buildRatingsDatasetJsonLd(
      weekModel(),
      "/college/football/ratings/fcs",
    );
    expect(ld["@type"]).toBe("Dataset");
    expect(ld.license).toBe(RATINGS_LICENSE_URL);
    expect(ld.url).toMatch(/\/college\/football\/ratings\/fcs$/);
    expect(ld.name).toBe(
      "2025 Postseason FCS Football ratings and strength of schedule",
    );
  });
});

describe("validation reports", () => {
  it("finds the FCS report and nothing for unknown pools", () => {
    expect(
      validationReport("football", "fcs")?.championRanks.length,
    ).toBeGreaterThan(0);
    expect(validationReport("football", "fbs")).toBeNull();
  });
});

describe("prediction summaries", () => {
  it("counts right winners, average miss, weeks of the latest season, and favorite size", () => {
    const summary = summarizePredictions([
      { year: 2026, seasonType: 2, weekNumber: 3, predicted: 2, actual: 5 },
      { year: 2026, seasonType: 2, weekNumber: 3, predicted: -10, actual: 4 },
      { year: 2026, seasonType: 3, weekNumber: 1, predicted: 25, actual: 0 },
      { year: 2025, seasonType: 2, weekNumber: 9, predicted: 8, actual: 10 },
    ]);
    expect(summary.currentYear).toBe(2026);
    // The tie is not a decided game.
    expect(summary.current).toMatchObject({ games: 2, correct: 1, pct: 0.5 });
    expect(summary.current.averageMiss).toBeCloseTo((3 + 14 + 25) / 3, 9);
    expect(summary.weeks.map((week) => week.label)).toEqual([
      "Week 3",
      "Postseason",
    ]);
    expect(summary.seasons.map((season) => season.year)).toEqual([2026, 2025]);
    expect(summary.allTime).toMatchObject({ games: 3, correct: 2 });
    const toss = summary.buckets.find((bucket) =>
      bucket.label.startsWith("Toss-up"),
    );
    expect(toss).toMatchObject({ games: 1, correct: 1 });
    expect(
      summary.buckets.find((bucket) => bucket.label.startsWith("Heavy"))?.games,
    ).toBe(0);
    expect(formatPct(0.7037)).toBe("70.4%");
  });

  it("handles no predictions", () => {
    const summary = summarizePredictions([]);
    expect(summary.currentYear).toBeNull();
    expect(summary.current).toEqual({
      games: 0,
      correct: 0,
      pct: 0,
      averageMiss: 0,
    });
  });
});
