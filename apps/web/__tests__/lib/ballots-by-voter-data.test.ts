const {
  mockGetSportIdBySlug,
  mockGetVotesForWeekAndYearByVoter,
  mockGetCachedFinalRankings,
  mockSanityFetch,
} = vi.hoisted(() => ({
  mockGetSportIdBySlug: vi.fn(),
  mockGetVotesForWeekAndYearByVoter: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockSanityFetch: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getVotesForWeekAndYearByVoter: mockGetVotesForWeekAndYearByVoter,
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockSanityFetch },
}));

vi.mock("@redshirt-sports/sanity/token", () => ({ token: "token" }));

vi.mock("@/lib/rankings-data", () => ({
  getCachedFinalRankings: mockGetCachedFinalRankings,
  RANKINGS_CACHE_TAG: "rankings",
  RANKINGS_CACHE_LIFE: {},
  rankingsSportTag: () => "sport",
  rankingsDivisionTag: () => "division",
  rankingsWeekTag: () => "week",
}));

import { beforeEach, describe, expect, it } from "vitest";

import { getCachedBallotsByVoterCards } from "@/lib/ballots-by-voter-data";

describe("getCachedBallotsByVoterCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [
        ...Array.from({ length: 15 }, (_, index) => ({
          _id: `t${index + 1}`,
          rank: index + 1,
          name: `Team ${index + 1}`,
          shortName: `T${index + 1}`,
          abbreviation: `T${index + 1}`,
          image: null,
        })),
        {
          _id: "t20",
          rank: 20,
          name: "Georgia",
          shortName: "Georgia",
          abbreviation: "UGA",
          image: null,
        },
      ],
    });
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: {
        userData: {
          firstName: "Jane",
          lastName: "Doe",
          organization: "",
          organizationRole: "",
        },
        votes: [
          { teamId: "t1", rank: 1 },
          { teamId: "t20", rank: 20 },
        ],
      },
    });
    mockSanityFetch.mockResolvedValue([]);
  });

  it("returns empty without sport", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      getCachedBallotsByVoterCards({
        sport: "football",
        division: "fbs",
        year: 2026,
        week: 7,
      }),
    ).resolves.toEqual([]);
  });

  it("builds voter ballot cards", async () => {
    const cards = await getCachedBallotsByVoterCards({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.slug).toBe("jane-doe");
    expect(cards[0]?.picks).toHaveLength(2);
    expect(cards[0]?.numberOneShortName).toBe("T1");
    expect(cards[0]?.omittedTop25.map((team) => team.teamId)).not.toContain(
      "t20",
    );
  });

  it("flags a published Top 25 team left off outside the old top 15", async () => {
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: {
        userData: {
          firstName: "Jane",
          lastName: "Doe",
          organization: "",
          organizationRole: "",
        },
        votes: [{ teamId: "t1", rank: 1 }],
      },
    });
    const cards = await getCachedBallotsByVoterCards({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(cards[0]?.omittedTop25).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teamId: "t20", consensusRank: 20 }),
      ]),
    );
  });

  it("fetches missing school metadata from Sanity", async () => {
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: {
        userData: {
          firstName: "Jane",
          lastName: "Doe",
          organization: "",
          organizationRole: "",
        },
        votes: [{ teamId: "missing", rank: 5 }],
      },
    });
    mockSanityFetch.mockResolvedValue([
      {
        _id: "missing",
        name: "Mystery",
        shortName: "Mystery",
        abbreviation: "MYS",
        image: null,
      },
    ]);
    const cards = await getCachedBallotsByVoterCards({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(cards[0]?.picks[0]?.shortName).toBe("Mystery");
  });

  it("skips empty ballots and sorts by outlier severity", async () => {
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue({
      u1: {
        userData: {
          firstName: "Low",
          lastName: "Outlier",
          organization: "",
          organizationRole: "",
        },
        votes: [{ teamId: "t1", rank: 1 }],
      },
      u2: {
        userData: {
          firstName: "High",
          lastName: "Outlier",
          organization: "",
          organizationRole: "",
        },
        votes: [
          { teamId: "t1", rank: 20 },
          { teamId: "t2", rank: 25 },
        ],
      },
      u3: { userData: null, votes: [{ teamId: "t1", rank: 1 }] },
      u4: {
        userData: {
          firstName: "Empty",
          lastName: "Ballot",
          organization: "",
          organizationRole: "",
        },
        votes: [],
      },
    });
    const cards = await getCachedBallotsByVoterCards({
      sport: "football",
      division: "fbs",
      year: 2026,
      week: 7,
    });
    expect(cards.map((c) => c.slug)).toEqual(["high-outlier", "low-outlier"]);
  });
});
