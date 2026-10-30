const {
  mockGetSportIdBySlug,
  mockGetVotesForWeekAndYearByVoter,
  mockGetCachedFinalRankings,
  mockGetCachedPollWeekBallotContext,
} = vi.hoisted(() => ({
  mockGetSportIdBySlug: vi.fn(),
  mockGetVotesForWeekAndYearByVoter: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockGetCachedPollWeekBallotContext: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getVotesForWeekAndYearByVoter: mockGetVotesForWeekAndYearByVoter,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedFinalRankings: mockGetCachedFinalRankings,
  getCachedPollWeekBallotContext: mockGetCachedPollWeekBallotContext,
  RANKINGS_CACHE_TAG: "rankings",
  RANKINGS_CACHE_LIFE: {},
  rankingsSportTag: () => "sport",
  rankingsDivisionTag: () => "division",
  rankingsWeekTag: () => "week",
}));

import { beforeEach, describe, expect, it } from "vitest";

import { getCachedBallotsPageMatrix } from "@/lib/ballots-page-data";

describe("getCachedBallotsPageMatrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetCachedPollWeekBallotContext.mockResolvedValue({
      ballotsCounted: 1,
      ballotsListedBySanityId: { t1: 1 },
    });
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [
        {
          _id: "t1",
          rank: 1,
          name: "Alabama",
          shortName: "Alabama",
          abbreviation: "ALA",
          image: null,
          _points: 100,
          firstPlaceVotes: 5,
        },
        {
          _id: "t2",
          rank: null,
          name: "Also",
          shortName: "Also",
          abbreviation: "AL",
          image: null,
          _points: 1,
          firstPlaceVotes: 0,
        },
      ],
    });
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: {
        userData: {
          firstName: "Jane",
          lastName: "Doe",
          organization: "ESPN",
        },
        votes: [{ teamId: "t1", rank: 1 }],
      },
      u2: {
        userData: {
          firstName: "Aaron",
          lastName: "Smith",
          organization: "AP",
        },
        votes: [{ teamId: "t1", rank: 20 }],
      },
    });
  });

  it("returns null without sport id", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedBallotsPageMatrix({
        sport: "football",
        division: "fbs",
        year: 2026,
        week: 7,
      }),
    ).resolves.toBeNull();
  });

  it("returns null without voters", async () => {
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({});
    await expect(
      getCachedBallotsPageMatrix({
        sport: "football",
        division: "fbs",
        year: 2026,
        week: 7,
      }),
    ).resolves.toBeNull();
  });

  it("builds matrix rows and voter labels", async () => {
    const matrix = await getCachedBallotsPageMatrix({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(matrix?.voters.map((v) => v.label).join(" ")).toContain("Jane Doe");
    expect(matrix?.rows).toHaveLength(2);
    expect(matrix?.topFirstPlaceVotes).toBe(5);
  });

  it("skips voters without user profiles", async () => {
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: { userData: null, votes: [{ teamId: "t1", rank: 1 }] },
      u2: {
        userData: {
          firstName: "A",
          lastName: "B",
          organization: null,
        },
        votes: [{ teamId: "t1", rank: 2 }],
      },
    });
    const matrix = await getCachedBallotsPageMatrix({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(matrix?.voters).toHaveLength(1);
    expect(matrix?.outlierPickCount).toBeGreaterThanOrEqual(0);
  });
});
