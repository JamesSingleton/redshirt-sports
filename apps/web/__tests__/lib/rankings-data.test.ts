const {
  mockGetYearsThatHaveVotes,
  mockGetWeeksThatHaveVotes,
  mockGetFinalRankingsForWeekAndYear,
  mockGetSchoolRankingHistory,
  mockSchoolHasPollRankings,
  mockGetRankedSchoolSanityIds,
  mockGetLatestFinalRankings,
  mockGetLatestFinalRankingsBySportSlug,
  mockGetSportIdBySlug,
  mockGetPollBySportAndSlug,
  mockResolveWeekIdForLegacyWeek,
  mockCountBallotsForPollWeek,
  mockGetBallotsListedBySanityIdForPollWeek,
  mockGetPollWeekVoterChips,
  mockGetVotesForWeekAndYearByVoter,
  mockListActivePollVoters,
  mockGetPollVoterBallotStatsForSeason,
} = vi.hoisted(() => ({
  mockGetYearsThatHaveVotes: vi.fn(),
  mockGetWeeksThatHaveVotes: vi.fn(),
  mockGetFinalRankingsForWeekAndYear: vi.fn(),
  mockGetSchoolRankingHistory: vi.fn(),
  mockSchoolHasPollRankings: vi.fn(),
  mockGetRankedSchoolSanityIds: vi.fn(),
  mockGetLatestFinalRankings: vi.fn(),
  mockGetLatestFinalRankingsBySportSlug: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetPollBySportAndSlug: vi.fn(),
  mockResolveWeekIdForLegacyWeek: vi.fn(),
  mockCountBallotsForPollWeek: vi.fn(),
  mockGetBallotsListedBySanityIdForPollWeek: vi.fn(),
  mockGetPollWeekVoterChips: vi.fn(),
  mockGetVotesForWeekAndYearByVoter: vi.fn(),
  mockListActivePollVoters: vi.fn(),
  mockGetPollVoterBallotStatsForSeason: vi.fn(),
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
  getLatestFinalRankingsBySportSlug: mockGetLatestFinalRankingsBySportSlug,
  getSportIdBySlug: mockGetSportIdBySlug,
  getPollBySportAndSlug: mockGetPollBySportAndSlug,
  resolveWeekIdForLegacyWeek: mockResolveWeekIdForLegacyWeek,
  countBallotsForPollWeek: mockCountBallotsForPollWeek,
  getBallotsListedBySanityIdForPollWeek:
    mockGetBallotsListedBySanityIdForPollWeek,
  getPollWeekVoterChips: mockGetPollWeekVoterChips,
  getVotesForWeekAndYearByVoter: mockGetVotesForWeekAndYearByVoter,
  listActivePollVoters: mockListActivePollVoters,
  getPollVoterBallotStatsForSeason: mockGetPollVoterBallotStatsForSeason,
}));

import {
  getCachedActivePollVoters,
  getCachedFinalRankings,
  getCachedLatestFinalRankings,
  getCachedLatestFinalRankingsBySportSlug,
  getCachedNavbarLatestRankings,
  getCachedPollVoterBallotStatsForSeason,
  getCachedPollWeekBallotContext,
  getCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory,
  getCachedVotesForWeekAndYearByVoter,
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

  it("getCachedLatestFinalRankingsBySportSlug delegates to db", async () => {
    mockGetLatestFinalRankingsBySportSlug.mockResolvedValue([]);
    await expect(
      getCachedLatestFinalRankingsBySportSlug("football"),
    ).resolves.toEqual([]);
    expect(mockGetLatestFinalRankingsBySportSlug).toHaveBeenCalledWith(
      "football",
    );
  });

  it("getCachedPollWeekBallotContext returns null when sport is unknown", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedPollWeekBallotContext({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toBeNull();
  });

  it("getCachedPollWeekBallotContext aggregates ballot context", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue({ id: "poll-1" });
    mockResolveWeekIdForLegacyWeek.mockResolvedValue("week-1");
    mockCountBallotsForPollWeek.mockResolvedValue(3);
    mockGetBallotsListedBySanityIdForPollWeek.mockResolvedValue(
      new Map([["school-1", 2]]),
    );
    mockGetPollWeekVoterChips.mockResolvedValue([
      { id: "voter-1", label: "AB" },
    ]);

    await expect(
      getCachedPollWeekBallotContext({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({
      ballotsCounted: 3,
      ballotsListedBySanityId: { "school-1": 2 },
      voterChips: [{ id: "voter-1", label: "AB" }],
    });
  });

  it("getCachedPollWeekBallotContext returns null when poll or week is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue(null);
    await expect(
      getCachedPollWeekBallotContext({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toBeNull();

    mockGetPollBySportAndSlug.mockResolvedValue({ id: "poll-1" });
    mockResolveWeekIdForLegacyWeek.mockResolvedValue(null);
    await expect(
      getCachedPollWeekBallotContext({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toBeNull();
  });

  it("getCachedVotesForWeekAndYearByVoter returns null without sport id", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedVotesForWeekAndYearByVoter({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toBeNull();
  });

  it("getCachedVotesForWeekAndYearByVoter delegates to db", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({ ballots: [] });
    await expect(
      getCachedVotesForWeekAndYearByVoter({
        sport: "football",
        division: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({ ballots: [] });
  });

  it("getCachedActivePollVoters returns empty when sport or poll is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedActivePollVoters({ sport: "football", division: "fbs" }),
    ).resolves.toEqual([]);

    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue(null);
    await expect(
      getCachedActivePollVoters({ sport: "football", division: "fbs" }),
    ).resolves.toEqual([]);
  });

  it("getCachedActivePollVoters lists voters for the poll", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue({ id: "poll-1" });
    mockListActivePollVoters.mockResolvedValue([{ id: "voter-1" }]);
    await expect(
      getCachedActivePollVoters({ sport: "football", division: "fbs" }),
    ).resolves.toEqual([{ id: "voter-1" }]);
  });

  it("getCachedPollVoterBallotStatsForSeason returns empty map when sport or poll is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedPollVoterBallotStatsForSeason({
        sport: "football",
        division: "fbs",
        year: 2026,
      }),
    ).resolves.toEqual(new Map());

    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue(null);
    await expect(
      getCachedPollVoterBallotStatsForSeason({
        sport: "football",
        division: "fbs",
        year: 2026,
      }),
    ).resolves.toEqual(new Map());
  });

  it("getCachedPollVoterBallotStatsForSeason loads stats for the poll season", async () => {
    const stats = new Map([
      ["user-1", { seasonBallotCount: 3, voterSince: new Date("2024-09-01") }],
    ]);
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetPollBySportAndSlug.mockResolvedValue({ id: "poll-1" });
    mockGetPollVoterBallotStatsForSeason.mockResolvedValue(stats);
    await expect(
      getCachedPollVoterBallotStatsForSeason({
        sport: "football",
        division: "fbs",
        year: 2026,
      }),
    ).resolves.toEqual(stats);
    expect(mockGetPollVoterBallotStatsForSeason).toHaveBeenCalledWith({
      pollId: "poll-1",
      year: 2026,
    });
  });
});
