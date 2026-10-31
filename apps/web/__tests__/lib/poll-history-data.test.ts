const {
  mockGetCachedWeeksThatHaveVotes,
  mockGetCachedFinalRankingsForLegacyWeeksInYear,
  mockGetCachedYearsThatHaveVotes,
} = vi.hoisted(() => ({
  mockGetCachedWeeksThatHaveVotes: vi.fn(),
  mockGetCachedFinalRankingsForLegacyWeeksInYear: vi.fn(),
  mockGetCachedYearsThatHaveVotes: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedWeeksThatHaveVotes: mockGetCachedWeeksThatHaveVotes,
  getCachedFinalRankingsForLegacyWeeksInYear:
    mockGetCachedFinalRankingsForLegacyWeeksInYear,
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

function rankingsForWeek(week: number) {
  return {
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
  };
}

describe("poll history data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([
      { week: 1 },
      { week: 2 },
    ]);
    mockGetCachedFinalRankingsForLegacyWeeksInYear.mockImplementation(
      async ({ legacyWeeks }) => {
        const map = new Map<number, ReturnType<typeof rankingsForWeek>>();
        for (const week of legacyWeeks as number[]) {
          map.set(week, rankingsForWeek(week));
        }
        return map;
      },
    );
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

  it("ignores weeks without a number one", async () => {
    mockGetCachedFinalRankingsForLegacyWeeksInYear.mockResolvedValue(
      new Map([
        [
          1,
          {
            rankings: [],
          },
        ],
        [
          2,
          {
            rankings: [
              {
                _id: "t1",
                rank: 1,
                name: "Alabama",
                shortName: "Alabama",
                _points: 50,
              },
            ],
          },
        ],
      ]),
    );
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
    mockGetCachedFinalRankingsForLegacyWeeksInYear.mockResolvedValue(
      new Map([
        [
          1,
          {
            rankings: [
              {
                _id: "t1",
                rank: 1,
                name: "Alabama",
                shortName: "Alabama",
                _points: 50,
              },
            ],
          },
        ],
        [
          2,
          {
            rankings: [
              {
                _id: "t1",
                rank: 1,
                name: "Alabama",
                shortName: "Alabama",
                _points: 50,
              },
            ],
          },
        ],
      ]),
    );
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
    expect(
      mockGetCachedFinalRankingsForLegacyWeeksInYear,
    ).toHaveBeenCalledTimes(1);
  });

  it("returns null when no weeks produce a number one", async () => {
    mockGetCachedFinalRankingsForLegacyWeeksInYear.mockResolvedValue(new Map());
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
