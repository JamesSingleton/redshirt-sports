vi.mock("@redshirt-sports/db/queries", () => ({
  getFinalRankingsForWeekAndYear: vi.fn(),
  getLatestFinalRankings: vi.fn(),
  getPollBySportSlugAndPollSlug: vi.fn(),
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://www.redshirtsports.com",
}));

import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getPollBySportSlugAndPollSlug,
} from "@redshirt-sports/db/queries";

import {
  buildSourceUrl,
  resolvePublicRankings,
  toPublicRankingsResponse,
} from "@/lib/rankings-api";
import * as voteBallot from "@/lib/vote-ballot";

const mockGetFinalRankingsForWeekAndYear = vi.mocked(
  getFinalRankingsForWeekAndYear,
);
const mockGetLatestFinalRankings = vi.mocked(getLatestFinalRankings);
const mockGetPollBySportSlugAndPollSlug = vi.mocked(
  getPollBySportSlugAndPollSlug,
);

describe("toPublicRankingsResponse", () => {
  it("maps Top 25 and others receiving votes into a partner-friendly DTO", () => {
    const body = toPublicRankingsResponse({
      sport: "football",
      division: "fcs",
      pollName: "FCS Top 25",
      baseUrl: "https://www.redshirtsports.com",
      data: {
        id: "poll:week",
        division: "fcs",
        week: 5,
        year: 2025,
        rankings: [
          {
            _id: "sanity-montana",
            _points: 1425,
            name: "Montana",
            shortName: "Montana",
            abbreviation: "MONT",
            slug: "montana",
            image: null,
            rank: 1,
            firstPlaceVotes: 12,
            isTie: false,
          },
          {
            _id: "sanity-orv-null",
            _points: 18,
            name: "Eastern Washington",
            shortName: "E. Washington",
            abbreviation: "EWU",
            slug: "eastern-washington",
            image: null,
            rank: null,
            firstPlaceVotes: 0,
            isTie: false,
          },
          {
            // Legacy publishes kept ordinal ranks > 25 for ORV rows.
            _id: "sanity-orv-ordinal",
            _points: 9,
            name: "Idaho",
            shortName: "Idaho",
            abbreviation: "IDHO",
            slug: "idaho",
            image: null,
            rank: 27,
            firstPlaceVotes: 0,
            isTie: false,
          },
        ],
      },
    });

    expect(body.rankings).toEqual([
      {
        rank: 1,
        isTie: false,
        points: 1425,
        firstPlaceVotes: 12,
        school: {
          id: "sanity-montana",
          name: "Montana",
          shortName: "Montana",
          abbreviation: "MONT",
          slug: "montana",
        },
      },
    ]);
    expect(body.othersReceivingVotes).toEqual([
      {
        rank: null,
        isTie: false,
        points: 18,
        firstPlaceVotes: 0,
        school: {
          id: "sanity-orv-null",
          name: "Eastern Washington",
          shortName: "E. Washington",
          abbreviation: "EWU",
          slug: "eastern-washington",
        },
      },
      {
        rank: null,
        isTie: false,
        points: 9,
        firstPlaceVotes: 0,
        school: {
          id: "sanity-orv-ordinal",
          name: "Idaho",
          shortName: "Idaho",
          abbreviation: "IDHO",
          slug: "idaho",
        },
      },
    ]);
    expect(body.sourceUrl).toBe(
      "https://www.redshirtsports.com/college/football/rankings/fcs/2025/5",
    );
  });

  it("uses final-rankings segment for postseason week", () => {
    const body = toPublicRankingsResponse({
      sport: "football",
      division: "fcs",
      pollName: "FCS Top 25",
      baseUrl: "https://www.redshirtsports.com",
      data: {
        id: "poll:week",
        division: "fcs",
        week: 999,
        year: 2025,
        rankings: [],
      },
    });

    expect(body.week).toMatchObject({
      number: 999,
      label: "Final Rankings",
      segment: "final-rankings",
      weekKey: "3-1",
      seasonType: 3,
      weekNumber: 1,
    });
    expect(body.sourceUrl).toBe(
      "https://www.redshirtsports.com/college/football/rankings/fcs/2025/final-rankings",
    );
  });
});

describe("buildSourceUrl", () => {
  it("builds the public rankings page URL", () => {
    expect(
      buildSourceUrl({
        sport: "football",
        division: "fcs",
        year: 2025,
        week: 0,
        baseUrl: "https://www.redshirtsports.com",
      }),
    ).toBe(
      "https://www.redshirtsports.com/college/football/rankings/fcs/2025/0",
    );
  });
});

describe("resolvePublicRankings", () => {
  beforeEach(() => {
    mockGetFinalRankingsForWeekAndYear.mockReset();
    mockGetLatestFinalRankings.mockReset();
    mockGetPollBySportSlugAndPollSlug.mockReset();
    vi.restoreAllMocks();
  });

  it("returns 400 when validation throws a non-Error value", async () => {
    vi.spyOn(voteBallot, "validateSport").mockImplementation(() => {
      throw "bad sport";
    });

    const result = await resolvePublicRankings({
      sportSlug: "football",
      divisionSlug: "fcs",
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "bad sport",
    });
  });

  it("returns 404 when rankings lookup rejects a non-Error value", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({
      id: "poll-1",
      name: "FCS Top 25",
      slug: "fcs",
      sportId: "sport-1",
      isActive: true,
      divisionSportId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockGetFinalRankingsForWeekAndYear.mockRejectedValue(
      "Unable to find season or week for rankings",
    );

    const result = await resolvePublicRankings({
      sportSlug: "football",
      divisionSlug: "fcs",
      year: 2025,
      week: 5,
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Rankings not found",
    });
  });

  it("returns 404 when rankings lookup fails with Unable to find", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({
      id: "poll-1",
      name: "FCS Top 25",
      slug: "fcs",
      sportId: "sport-1",
      isActive: true,
      divisionSportId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockGetFinalRankingsForWeekAndYear.mockRejectedValue(
      new Error("Unable to find season or week for rankings"),
    );

    const result = await resolvePublicRankings({
      sportSlug: "football",
      divisionSlug: "fcs",
      year: 2025,
      week: 5,
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Rankings not found",
    });
  });
});
