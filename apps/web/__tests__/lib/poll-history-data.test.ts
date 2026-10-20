const {
  mockGetCachedWeeksThatHaveVotes,
  mockGetCachedFinalRankings,
  mockGetCachedYearsThatHaveVotes,
} = vi.hoisted(() => ({
  mockGetCachedWeeksThatHaveVotes: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockGetCachedYearsThatHaveVotes: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedWeeksThatHaveVotes: mockGetCachedWeeksThatHaveVotes,
  getCachedFinalRankings: mockGetCachedFinalRankings,
  getCachedYearsThatHaveVotes: mockGetCachedYearsThatHaveVotes,
  RANKINGS_CACHE_TAG: "rankings",
  RANKINGS_CACHE_LIFE: {},
  rankingsSportTag: () => "sport",
  rankingsDivisionTag: () => "division",
}));

import { beforeEach, describe, expect, it } from "vitest";

import {
  getCachedPollHistoryForDivision,
  getCachedPollHistoryYears,
} from "@/lib/poll-history-data";

describe("poll history data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([
      { week: 1 },
      { week: 2 },
    ]);
    mockGetCachedFinalRankings.mockImplementation(async ({ week }) => ({
      rankings:
        week === 1
          ? []
          : [
              {
                _id: "t1",
                rank: 1,
                name: "Alabama",
                shortName: "Alabama",
                slug: "alabama",
                _points: 50,
              },
            ],
    }));
    mockGetCachedYearsThatHaveVotes.mockResolvedValue([2025, 2026]);
  });

  it("returns null when no weeks have votes", async () => {
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([]);
    await expect(
      getCachedPollHistoryForDivision({
        sport: "football",
        division: "fbs",
        year: 2026,
      }),
    ).resolves.toBeNull();
  });

  it("ignores rejected week fetches", async () => {
    mockGetCachedFinalRankings.mockImplementation(async ({ week }) => {
      if (week === 1) {
        throw new Error("fail");
      }
      return {
        rankings: [
          {
            _id: "t1",
            rank: 1,
            name: "Alabama",
            shortName: "Alabama",
            _points: 50,
          },
        ],
      };
    });
    const season = await getCachedPollHistoryForDivision({
      sport: "football",
      division: "fbs",
      year: 2026,
    });
    expect(season?.weeks).toHaveLength(1);
  });

  it("builds season week list with number ones", async () => {
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([
      { week: 2 },
      { week: 1 },
    ]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [
        {
          _id: "t1",
          rank: 1,
          name: "Alabama",
          shortName: "Alabama",
          _points: 50,
        },
      ],
    });
    const season = await getCachedPollHistoryForDivision({
      sport: "football",
      division: "fbs",
      year: 2026,
    });
    expect(season?.weeks).toHaveLength(2);
    expect(season?.weeks[0]?.week).toBe(1);
    expect(season?.weeks[1]?.week).toBe(2);
    expect(season?.teams).toHaveLength(1);
    expect(season?.teams[0]?.ranks).toHaveLength(2);
  });

  it("returns null when no weeks produce a number one", async () => {
    mockGetCachedFinalRankings.mockResolvedValue({ rankings: [] });
    await expect(
      getCachedPollHistoryForDivision({
        sport: "football",
        division: "fbs",
        year: 2026,
      }),
    ).resolves.toBeNull();
  });

  it("delegates year lookup", async () => {
    await expect(getCachedPollHistoryYears("fbs")).resolves.toEqual([
      2025, 2026,
    ]);
  });
});
