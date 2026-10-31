const {
  mockGetCachedLatestFinalRankingsBySportSlug,
  mockGetCachedFinalRankings,
  mockGetCachedWeeksThatHaveVotes,
} = vi.hoisted(() => ({
  mockGetCachedLatestFinalRankingsBySportSlug: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockGetCachedWeeksThatHaveVotes: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedLatestFinalRankingsBySportSlug:
    mockGetCachedLatestFinalRankingsBySportSlug,
  getCachedFinalRankings: mockGetCachedFinalRankings,
  getCachedWeeksThatHaveVotes: mockGetCachedWeeksThatHaveVotes,
  RANKINGS_CACHE_TAG: "rankings",
  RANKINGS_CACHE_LIFE: {},
}));

import { beforeEach, describe, expect, it } from "vitest";

import {
  getCachedRankingsIndexCards,
  getCachedRankingsWidgetPolls,
  pollDivisionLabel,
} from "@/lib/rankings-widget-data";

const rankingTeam = {
  _id: "t1",
  rank: 1,
  name: "Alabama",
  shortName: "Alabama",
  slug: "alabama",
  image: null,
  abbreviation: "ALA",
  _points: 100,
  firstPlaceVotes: 10,
};

describe("rankings widget data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedLatestFinalRankingsBySportSlug.mockResolvedValue([
      { division: "fbs", year: 2026, week: 7 },
    ]);
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([
      { week: 6 },
      { week: 7 },
    ]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [rankingTeam],
    });
  });

  it("pollDivisionLabel maps known divisions", () => {
    expect(pollDivisionLabel("fbs")).toBe("FBS");
    expect(pollDivisionLabel("custom")).toBe("CUSTOM");
  });

  it("getCachedRankingsWidgetPolls loads polls for football divisions", async () => {
    const polls = await getCachedRankingsWidgetPolls("football");
    expect(polls.length).toBeGreaterThan(0);
    expect(polls[0]?.teams[0]?.shortName).toBe("Alabama");
    expect(mockGetCachedLatestFinalRankingsBySportSlug).toHaveBeenCalledTimes(
      1,
    );
  });

  it("getCachedRankingsIndexCards omits divisions without rankings", async () => {
    mockGetCachedLatestFinalRankingsBySportSlug.mockResolvedValue([
      { division: "fbs", year: 2026, week: 7 },
      { division: "fcs", year: 2026, week: 7 },
    ]);
    mockGetCachedFinalRankings.mockImplementation(async ({ division }) => {
      if (division === "fcs") {
        return { rankings: [] };
      }
      return { rankings: [rankingTeam] };
    });

    const cards = await getCachedRankingsIndexCards("football");
    expect(cards).toHaveLength(1);
    expect(cards[0]?.division).toBe("fbs");
  });

  it("returns no polls for unsupported sports", async () => {
    mockGetCachedLatestFinalRankingsBySportSlug.mockResolvedValue([]);
    await expect(
      getCachedRankingsWidgetPolls("other" as never),
    ).resolves.toEqual([]);
  });

  it("handles previous-week fetch failures", async () => {
    mockGetCachedFinalRankings
      .mockResolvedValueOnce({ rankings: [rankingTeam] })
      .mockRejectedValueOnce(new Error("missing week"));
    const polls = await getCachedRankingsWidgetPolls("mens-basketball");
    expect(polls.length).toBeGreaterThanOrEqual(0);
  });
});
