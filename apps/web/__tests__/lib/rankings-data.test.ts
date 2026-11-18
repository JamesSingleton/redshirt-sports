const {
  mockGetYearsThatHaveVotes,
  mockGetWeeksThatHaveVotes,
  mockGetFinalRankingsForWeekAndYear,
  mockGetFinalRankingsForLegacyWeeksInYear,
  mockGetSchoolRankingHistory,
  mockGetRankedSchoolSanityIds,
  mockGetLatestFinalRankings,
  mockGetLatestFinalRankingsBySportSlug,
  mockGetSportIdBySlug,
  mockGetPollBySportSlugAndPollSlug,
  mockResolvePollWeekBySlugs,
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
  mockGetFinalRankingsForLegacyWeeksInYear: vi.fn(),
  mockGetSchoolRankingHistory: vi.fn(),
  mockGetRankedSchoolSanityIds: vi.fn(),
  mockGetLatestFinalRankings: vi.fn(),
  mockGetLatestFinalRankingsBySportSlug: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetPollBySportSlugAndPollSlug: vi.fn(),
  mockResolvePollWeekBySlugs: vi.fn(),
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
  getFinalRankingsForLegacyWeeksInYear:
    mockGetFinalRankingsForLegacyWeeksInYear,
  getSchoolRankingHistory: mockGetSchoolRankingHistory,
  getRankedSchoolSanityIds: mockGetRankedSchoolSanityIds,
  getLatestFinalRankings: mockGetLatestFinalRankings,
  getLatestFinalRankingsBySportSlug: mockGetLatestFinalRankingsBySportSlug,
  getSportIdBySlug: mockGetSportIdBySlug,
  getPollBySportSlugAndPollSlug: mockGetPollBySportSlugAndPollSlug,
  resolvePollWeekBySlugs: mockResolvePollWeekBySlugs,
  countBallotsForPollWeek: mockCountBallotsForPollWeek,
  getBallotsListedBySanityIdForPollWeek:
    mockGetBallotsListedBySanityIdForPollWeek,
  getPollWeekVoterChips: mockGetPollWeekVoterChips,
  getVotesForWeekAndYearByVoter: mockGetVotesForWeekAndYearByVoter,
  listActivePollVoters: mockListActivePollVoters,
  getPollVoterBallotStatsForSeason: mockGetPollVoterBallotStatsForSeason,
}));

import { rankingsInvalidationTags } from "@redshirt-sports/db/rankings-cache-tags";
import { cacheTag } from "next/cache";

import {
  getCachedActivePollVoters,
  getCachedFinalRankings,
  getCachedFinalRankingsForLegacyWeeksInYear,
  getCachedLatestFinalRankings,
  getCachedLatestFinalRankingsBySportSlug,
  getCachedLatestPublishedPoll,
  getCachedPollVoterBallotStatsForSeason,
  getCachedPollWeekBallotContext,
  getCachedRankedSchoolSanityIds,
  getCachedSchoolRankingHistory,
  getCachedVotesForWeekAndYearByVoter,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
} from "@/lib/rankings-data";

describe("rankings-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishing a poll week expires every cached read of that poll", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    const reads = [
      () => getCachedYearsThatHaveVotes({ division: "fcs" }),
      () => getCachedWeeksThatHaveVotes({ year: 2026, division: "fcs" }),
      () =>
        getCachedFinalRankings({
          year: 2026,
          week: 7,
          division: "fcs",
          sport: "football",
        }),
      () =>
        getCachedFinalRankingsForLegacyWeeksInYear({
          year: 2026,
          division: "fcs",
          sport: "football",
          legacyWeeks: [7],
        }),
      () => getCachedLatestFinalRankings({ division: "fcs" }),
      () => getCachedLatestFinalRankingsBySportSlug("football"),
      () => getCachedRankedSchoolSanityIds(),
      () =>
        getCachedVotesForWeekAndYearByVoter({
          sport: "football",
          division: "fcs",
          year: 2026,
          week: 7,
        }),
    ];
    const published = new Set(
      rankingsInvalidationTags({
        sport: "football",
        division: "fcs",
        year: 2026,
        week: 7,
      }),
    );

    for (const read of reads) {
      vi.mocked(cacheTag).mockClear();
      await read();
      const tags = vi.mocked(cacheTag).mock.calls.flat();
      expect(
        tags.some((tag) => published.has(tag)),
        String(read),
      ).toBe(true);
    }
  });

  it("getCachedSchoolRankingHistory tags the school and each poll season it appears in", async () => {
    const history = {
      polls: [
        { pollSlug: "fcs", years: [2025, 2026] },
        { pollSlug: "fbs", years: [2026] },
      ],
    };
    mockGetSchoolRankingHistory.mockResolvedValue(history);
    await expect(getCachedSchoolRankingHistory("school-1")).resolves.toBe(
      history,
    );
    expect(cacheTag).toHaveBeenCalledWith(
      "rankings:school:school-1",
      "rankings:fcs:2025:weeks",
      "rankings:fcs:2026:weeks",
      "rankings:fbs:2026:weeks",
    );
    expect(cacheTag).not.toHaveBeenCalledWith(
      expect.stringMatching(/^rankings$/),
    );
  });

  it("getCachedSchoolRankingHistory tags an unranked school by school only", async () => {
    mockGetSchoolRankingHistory.mockResolvedValue({ polls: [] });
    await getCachedSchoolRankingHistory("school-2");
    expect(cacheTag).toHaveBeenCalledWith("rankings:school:school-2");
  });

  it("getCachedLatestPublishedPoll scopes by sport and tags the poll", async () => {
    const latest = { division: "fcs", week: 8, year: 2026, publishedAt: null };
    mockGetLatestFinalRankings.mockResolvedValueOnce(latest);

    await expect(
      getCachedLatestPublishedPoll({ sport: "football", division: "fcs" }),
    ).resolves.toEqual(latest);
    expect(mockGetLatestFinalRankings).toHaveBeenCalledWith({
      division: "fcs",
      sport: "football",
    });
    expect(cacheTag).toHaveBeenCalledWith("rankings:football:fcs");
  });

  it("getCachedLatestPublishedPoll returns null before the first publish", async () => {
    mockGetLatestFinalRankings.mockResolvedValueOnce(undefined);

    await expect(
      getCachedLatestPublishedPoll({
        sport: "mens-basketball",
        division: "power-conferences",
      }),
    ).resolves.toBeNull();
  });

  const ballotContextInput = {
    sport: "football" as const,
    division: "fbs",
    year: 2025,
    week: 1,
  };

  it("getCachedPollWeekBallotContext returns null when the poll is unknown", async () => {
    mockResolvePollWeekBySlugs.mockResolvedValue(null);
    await expect(
      getCachedPollWeekBallotContext(ballotContextInput),
    ).resolves.toBeNull();
  });

  it("getCachedPollWeekBallotContext aggregates ballot context", async () => {
    mockResolvePollWeekBySlugs.mockResolvedValue({
      sportId: "sport-1",
      poll: { id: "poll-1" },
      weekId: "week-1",
    });
    mockCountBallotsForPollWeek.mockResolvedValue(3);
    mockGetBallotsListedBySanityIdForPollWeek.mockResolvedValue(
      new Map([["school-1", 2]]),
    );
    mockGetPollWeekVoterChips.mockResolvedValue([
      { id: "voter-1", label: "AB" },
    ]);

    await expect(
      getCachedPollWeekBallotContext(ballotContextInput),
    ).resolves.toEqual({
      ballotsCounted: 3,
      ballotsListedBySanityId: { "school-1": 2 },
      voterChips: [{ id: "voter-1", label: "AB" }],
    });
    // Sport, poll, and week resolve in one lookup.
    expect(mockResolvePollWeekBySlugs).toHaveBeenCalledWith({
      sport: "football",
      division: "fbs",
      year: 2025,
      legacyWeek: 1,
    });
    expect(mockGetSportIdBySlug).not.toHaveBeenCalled();
    expect(mockCountBallotsForPollWeek).toHaveBeenCalledWith({
      pollId: "poll-1",
      weekId: "week-1",
    });
  });

  it("getCachedPollWeekBallotContext returns null when the week is missing", async () => {
    mockResolvePollWeekBySlugs.mockResolvedValue({
      sportId: "sport-1",
      poll: { id: "poll-1" },
      weekId: null,
    });
    await expect(
      getCachedPollWeekBallotContext(ballotContextInput),
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

  it("getCachedActivePollVoters returns empty when the poll is unknown", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue(null);
    await expect(
      getCachedActivePollVoters({ sport: "football", division: "fbs" }),
    ).resolves.toEqual([]);
  });

  it("getCachedActivePollVoters lists voters for the poll", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({ id: "poll-1" });
    mockListActivePollVoters.mockResolvedValue([{ id: "voter-1" }]);
    await expect(
      getCachedActivePollVoters({ sport: "football", division: "fbs" }),
    ).resolves.toEqual([{ id: "voter-1" }]);
    expect(mockGetPollBySportSlugAndPollSlug).toHaveBeenCalledWith({
      sportSlug: "football",
      pollSlug: "fbs",
    });
  });

  it("getCachedPollVoterBallotStatsForSeason returns an empty map when the poll is unknown", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue(null);
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
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({ id: "poll-1" });
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
