const {
  mockGetFinalRankingsForWeekAndYear,
  mockGetLatestFinalRankings,
  mockGetPollBySportSlugAndPollSlug,
  mockRatelimit,
} = vi.hoisted(() => ({
  mockGetFinalRankingsForWeekAndYear: vi.fn(),
  mockGetLatestFinalRankings: vi.fn(),
  mockGetPollBySportSlugAndPollSlug: vi.fn(),
  mockRatelimit: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getFinalRankingsForWeekAndYear: mockGetFinalRankingsForWeekAndYear,
  getLatestFinalRankings: mockGetLatestFinalRankings,
  getPollBySportSlugAndPollSlug: mockGetPollBySportSlugAndPollSlug,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://www.redshirtsports.com",
}));

vi.mock("@/server/ratelimit", () => ({
  rankingsApiRatelimit: { limit: mockRatelimit },
}));

import {
  GET as getWeek,
  OPTIONS as optionsWeek,
} from "@/app/api/v1/college/[sport]/rankings/[division]/[year]/[week]/route";
import {
  GET as getLatest,
  OPTIONS as optionsLatest,
} from "@/app/api/v1/college/[sport]/rankings/[division]/route";
import { handleRankingsApiGet } from "@/lib/rankings-api-route";

const sampleRankings = {
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
      _id: "sanity-orv",
      _points: 18,
      name: "Eastern Washington",
      shortName: "E. Washington",
      abbreviation: "EWU",
      slug: "eastern-washington",
      image: null,
      rank: 26,
      firstPlaceVotes: 0,
      isTie: false,
    },
  ],
};

function latestParams() {
  return Promise.resolve({ sport: "football", division: "fcs" });
}

function weekParams(overrides?: {
  sport?: string;
  division?: string;
  year?: string;
  week?: string;
}) {
  return Promise.resolve({
    sport: "football",
    division: "fcs",
    year: "2025",
    week: "5",
    ...overrides,
  });
}

describe("GET /api/v1/college/[sport]/rankings/[division]", () => {
  beforeEach(() => {
    mockGetFinalRankingsForWeekAndYear.mockReset();
    mockGetLatestFinalRankings.mockReset();
    mockGetPollBySportSlugAndPollSlug.mockReset();
    mockRatelimit.mockReset();
    mockRatelimit.mockResolvedValue({ success: true });
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({
      id: "poll-1",
      name: "FCS Top 25",
      slug: "fcs",
    });
  });

  it("returns the latest published rankings", async () => {
    mockGetLatestFinalRankings.mockResolvedValue({
      division: "fcs",
      week: 5,
      year: 2025,
    });
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue(sampleRankings);

    const res = await getLatest(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs",
      ),
      { params: latestParams() },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");

    const body = await res.json();
    expect(body.poll.name).toBe("FCS Top 25");
    expect(body.rankings).toHaveLength(1);
    expect(body.rankings[0]).toMatchObject({
      rank: 1,
      points: 1425,
      school: { id: "sanity-montana", name: "Montana" },
    });
    expect(body.othersReceivingVotes).toEqual([
      expect.objectContaining({
        rank: null,
        points: 18,
        school: expect.objectContaining({
          id: "sanity-orv",
          name: "Eastern Washington",
        }),
      }),
    ]);
    expect(mockGetFinalRankingsForWeekAndYear).toHaveBeenCalledWith({
      year: 2025,
      week: 5,
      division: "fcs",
      sport: "football",
    });
  });

  it("supports CORS preflight", async () => {
    const res = await optionsLatest();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns 404 when the poll does not exist", async () => {
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue(null);

    const res = await getLatest(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs",
      ),
      { params: latestParams() },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Poll not found" });
  });

  it("returns 404 when no rankings have been published", async () => {
    mockGetLatestFinalRankings.mockResolvedValue(undefined);

    const res = await getLatest(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs",
      ),
      { params: latestParams() },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Rankings not found" });
  });

  it("returns 400 for invalid division", async () => {
    const res = await getLatest(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/d1",
      ),
      {
        params: Promise.resolve({ sport: "football", division: "d1" }),
      },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid division/);
  });

  it("returns 429 when rate limited", async () => {
    mockRatelimit.mockResolvedValue({ success: false });

    const res = await getLatest(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs",
      ),
      { params: latestParams() },
    );

    expect(res.status).toBe(429);
  });
});

describe("GET /api/v1/college/[sport]/rankings/[division]/[year]/[week]", () => {
  beforeEach(() => {
    mockGetFinalRankingsForWeekAndYear.mockReset();
    mockGetLatestFinalRankings.mockReset();
    mockGetPollBySportSlugAndPollSlug.mockReset();
    mockRatelimit.mockReset();
    mockRatelimit.mockResolvedValue({ success: true });
    mockGetPollBySportSlugAndPollSlug.mockResolvedValue({
      id: "poll-1",
      name: "FCS Top 25",
      slug: "fcs",
    });
  });

  it("returns rankings for a specific week", async () => {
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue(sampleRankings);

    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
      ),
      { params: weekParams() },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.week.number).toBe(5);
    expect(body.sourceUrl).toBe(
      "https://www.redshirtsports.com/college/football/rankings/fcs/2025/5",
    );
    expect(mockGetLatestFinalRankings).not.toHaveBeenCalled();
  });

  it("accepts final-rankings week segment", async () => {
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue({
      ...sampleRankings,
      week: 999,
    });

    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/final-rankings",
      ),
      { params: weekParams({ week: "final-rankings" }) },
    );

    expect(res.status).toBe(200);
    expect(mockGetFinalRankingsForWeekAndYear).toHaveBeenCalledWith({
      year: 2025,
      week: 999,
      division: "fcs",
      sport: "football",
    });
  });

  it("supports CORS preflight", async () => {
    const res = await optionsWeek();
    expect(res.status).toBe(204);
  });

  it("returns 400 for invalid week segment", async () => {
    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/nope",
      ),
      { params: weekParams({ week: "nope" }) },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid week/);
  });

  it("returns 400 for invalid year", async () => {
    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/abc/5",
      ),
      { params: weekParams({ year: "abc" }) },
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid year/);
  });

  it("returns 404 when the week has no published rankings", async () => {
    mockGetFinalRankingsForWeekAndYear.mockRejectedValue(
      new Error("Rankings not found"),
    );

    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
      ),
      { params: weekParams() },
    );

    expect(res.status).toBe(404);
  });

  it("returns 500 when ranking lookup fails unexpectedly", async () => {
    mockGetFinalRankingsForWeekAndYear.mockRejectedValue(
      new Error("connection refused"),
    );

    const res = await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
        { headers: { "x-real-ip": "203.0.113.10" } },
      ),
      { params: weekParams() },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("rate-limits using x-forwarded-for when present", async () => {
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue(sampleRankings);

    await getWeek(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
        { headers: { "x-forwarded-for": "198.51.100.1, 10.0.0.1" } },
      ),
      { params: weekParams() },
    );

    expect(mockRatelimit).toHaveBeenCalledWith("rankings-api:198.51.100.1");
  });

  it("returns 400 when only year is provided without week", async () => {
    const res = await handleRankingsApiGet(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
      ),
      {
        sport: "football",
        division: "fcs",
        year: "2025",
      },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Both year and week are required",
    });
  });

  it("falls back to x-real-ip when x-forwarded-for is blank", async () => {
    mockGetFinalRankingsForWeekAndYear.mockResolvedValue(sampleRankings);

    await handleRankingsApiGet(
      new Request(
        "https://www.redshirtsports.com/api/v1/college/football/rankings/fcs/2025/5",
        {
          headers: {
            "x-forwarded-for": " , ",
            "x-real-ip": "203.0.113.44",
          },
        },
      ),
      { sport: "football", division: "fcs", year: "2025", week: "5" },
    );

    expect(mockRatelimit).toHaveBeenCalledWith("rankings-api:203.0.113.44");
  });
});
