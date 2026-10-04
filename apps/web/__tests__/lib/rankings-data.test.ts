const {
  mockGetYearsThatHaveVotes,
  mockGetWeeksThatHaveVotes,
  mockGetFinalRankingsForWeekAndYear,
  mockGetSchoolRankingHistory,
  mockSchoolHasPollRankings,
  mockGetRankedSchoolSanityIds,
  mockGetLatestFinalRankings,
} = vi.hoisted(() => ({
  mockGetYearsThatHaveVotes: vi.fn(),
  mockGetWeeksThatHaveVotes: vi.fn(),
  mockGetFinalRankingsForWeekAndYear: vi.fn(),
  mockGetSchoolRankingHistory: vi.fn(),
  mockSchoolHasPollRankings: vi.fn(),
  mockGetRankedSchoolSanityIds: vi.fn(),
  mockGetLatestFinalRankings: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getYearsThatHaveVotes: mockGetYearsThatHaveVotes,
  getWeeksThatHaveVotes: mockGetWeeksThatHaveVotes,
  getFinalRankingsForWeekAndYear: mockGetFinalRankingsForWeekAndYear,
  getSchoolRankingHistory: mockGetSchoolRankingHistory,
  schoolHasPollRankings: mockSchoolHasPollRankings,
  getRankedSchoolSanityIds: mockGetRankedSchoolSanityIds,
  getLatestFinalRankings: mockGetLatestFinalRankings,
}));

import {
  getCachedFinalRankings,
  getCachedLatestFinalRankings,
  getCachedLatestPoll,
  getCachedLatestPollWeek,
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

  it("getCachedLatestPollWeek returns the newest year and week for a sport and division", async () => {
    mockGetLatestFinalRankings.mockResolvedValue({
      division: "fcs",
      week: 4,
      year: 2026,
    });

    await expect(
      getCachedLatestPollWeek({ sport: "football", division: "fcs" }),
    ).resolves.toEqual({ year: 2026, week: 4 });
    expect(mockGetLatestFinalRankings).toHaveBeenCalledWith({
      division: "fcs",
      sport: "football",
    });
  });

  it("getCachedLatestPollWeek returns null when the division has no votes", async () => {
    mockGetLatestFinalRankings.mockResolvedValue(null);

    await expect(
      getCachedLatestPollWeek({
        sport: "mens-basketball",
        division: "mid-major",
      }),
    ).resolves.toBeNull();
  });

  it("getCachedLatestPoll loads the newest week for a division", async () => {
    mockGetLatestFinalRankings.mockResolvedValue({
      division: "fbs",
      week: 5,
      year: 2026,
    });
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue({
      id: "poll:week",
      division: "fbs",
      week: 5,
      year: 2026,
      rankings: [],
    });

    await expect(
      getCachedLatestPoll({ sport: "football", division: "fbs" }),
    ).resolves.toEqual({
      id: "poll:week",
      division: "fbs",
      week: 5,
      year: 2026,
      rankings: [],
      sport: "football",
    });
    expect(mockGetFinalRankingsForWeekAndYear).toHaveBeenCalledWith({
      year: 2026,
      week: 5,
      division: "fbs",
      sport: "football",
    });
  });

  it("getCachedLatestPoll returns null when the division has no votes", async () => {
    mockGetLatestFinalRankings.mockResolvedValue(undefined);

    await expect(
      getCachedLatestPoll({ sport: "football", division: "d3" }),
    ).resolves.toBeNull();
    expect(mockGetFinalRankingsForWeekAndYear).not.toHaveBeenCalled();
  });

  it("getCachedLatestPoll returns null when the rankings lookup fails", async () => {
    mockGetLatestFinalRankings.mockResolvedValue({
      division: "fbs",
      week: 5,
      year: 2026,
    });
    mockGetFinalRankingsForWeekAndYear.mockRejectedValue(
      new Error("Rankings not found"),
    );

    await expect(
      getCachedLatestPoll({ sport: "football", division: "fbs" }),
    ).resolves.toBeNull();
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

  it("getCachedLatestFinalRankings delegates to db", async () => {
    mockGetLatestFinalRankings.mockResolvedValue({
      division: "fcs",
      week: 2,
      year: 2026,
    });
    await expect(
      getCachedLatestFinalRankings({ division: "fcs" }),
    ).resolves.toEqual({
      division: "fcs",
      week: 2,
      year: 2026,
    });
  });
});
