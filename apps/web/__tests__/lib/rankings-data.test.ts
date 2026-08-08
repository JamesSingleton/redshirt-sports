const {
  mockGetYearsThatHaveVotes,
  mockGetWeeksThatHaveVotes,
  mockGetFinalRankingsForWeekAndYear,
  mockGetSchoolRankingHistory,
  mockSchoolHasPollRankings,
  mockGetRankedSchoolSanityIds,
  mockGetLatestFinalRankingsBySportSlug,
} = vi.hoisted(() => ({
  mockGetYearsThatHaveVotes: vi.fn(),
  mockGetWeeksThatHaveVotes: vi.fn(),
  mockGetFinalRankingsForWeekAndYear: vi.fn(),
  mockGetSchoolRankingHistory: vi.fn(),
  mockSchoolHasPollRankings: vi.fn(),
  mockGetRankedSchoolSanityIds: vi.fn(),
  mockGetLatestFinalRankingsBySportSlug: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getYearsThatHaveVotes: mockGetYearsThatHaveVotes,
  getWeeksThatHaveVotes: mockGetWeeksThatHaveVotes,
  getFinalRankingsForWeekAndYear: mockGetFinalRankingsForWeekAndYear,
  getSchoolRankingHistory: mockGetSchoolRankingHistory,
  schoolHasPollRankings: mockSchoolHasPollRankings,
  getRankedSchoolSanityIds: mockGetRankedSchoolSanityIds,
  getLatestFinalRankingsBySportSlug: mockGetLatestFinalRankingsBySportSlug,
}));

import {
  getCachedFinalRankings,
  getCachedNavbarLatestRankings,
  getCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
} from "@/lib/rankings-data";

describe("rankings-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCachedNavbarLatestRankings aggregates football and basketball", async () => {
    mockGetLatestFinalRankingsBySportSlug
      .mockResolvedValueOnce([{ division: "fbs", week: 1, year: 2025 }])
      .mockResolvedValueOnce([{ division: "d1", week: 2, year: 2025 }]);

    await expect(getCachedNavbarLatestRankings()).resolves.toEqual([
      {
        sport: "football",
        divisions: [{ division: "fbs", week: 1, year: 2025 }],
      },
      {
        sport: "mens-basketball",
        divisions: [{ division: "d1", week: 2, year: 2025 }],
      },
    ]);
    expect(mockGetLatestFinalRankingsBySportSlug).toHaveBeenCalledWith(
      "football",
    );
    expect(mockGetLatestFinalRankingsBySportSlug).toHaveBeenCalledWith(
      "mens-basketball",
    );
  });

  it("getCachedYearsThatHaveVotes delegates to db", async () => {
    mockGetYearsThatHaveVotes.mockResolvedValue([2024, 2025]);
    await expect(
      getCachedYearsThatHaveVotes({ division: "fbs" }),
    ).resolves.toEqual([2024, 2025]);
    expect(mockGetYearsThatHaveVotes).toHaveBeenCalledWith({
      division: "fbs",
    });
  });

  it("getCachedWeeksThatHaveVotes delegates to db", async () => {
    mockGetWeeksThatHaveVotes.mockResolvedValue([{ week: 1, year: 2025 }]);
    await expect(
      getCachedWeeksThatHaveVotes({ year: 2025, division: "fbs" }),
    ).resolves.toEqual([{ week: 1, year: 2025 }]);
  });

  it("getCachedFinalRankings delegates to db", async () => {
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue([]);
    await expect(
      getCachedFinalRankings({
        year: 2025,
        week: 1,
        division: "fbs",
        sport: "football",
      }),
    ).resolves.toEqual([]);
  });

  it("getCachedSchoolRankingHistory delegates to db", async () => {
    mockGetSchoolRankingHistory.mockResolvedValue({ seasons: [] });
    await expect(getCachedSchoolRankingHistory("school-1")).resolves.toEqual({
      seasons: [],
    });
  });

  it("getCachedSchoolHasPollRankings delegates to db", async () => {
    mockSchoolHasPollRankings.mockResolvedValue(true);
    await expect(getCachedSchoolHasPollRankings("school-1")).resolves.toBe(
      true,
    );
  });

  it("getCachedRankedSchoolSanityIds delegates to db", async () => {
    mockGetRankedSchoolSanityIds.mockResolvedValue(["a", "b"]);
    await expect(getCachedRankedSchoolSanityIds()).resolves.toEqual(["a", "b"]);
  });
});
