const {
  mockAuth,
  mockGetSportIdBySlug,
  mockGetUserById,
  mockGetVoterBallotSchoolEntries,
  mockGetVotingSeasonInfoBySportIds,
  mockRatelimit,
  mockImageResponse,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetUserById: vi.fn(),
  mockGetVoterBallotSchoolEntries: vi.fn(),
  mockGetVotingSeasonInfoBySportIds: vi.fn(),
  mockRatelimit: vi.fn(),
  mockImageResponse: vi.fn(),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: mockAuth,
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getUserById: mockGetUserById,
  getVoterBallotSchoolEntries: mockGetVoterBallotSchoolEntries,
  getVotingSeasonInfoBySportIds: mockGetVotingSeasonInfoBySportIds,
}));

vi.mock("@/server/ratelimit", () => ({
  ratelimit: { limit: mockRatelimit },
}));

vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    headers: Headers;
    body: null;
    constructor() {
      this.headers = new Headers({ "Content-Type": "image/png" });
      this.body = null;
      mockImageResponse();
    }
  },
}));

vi.mock("@/lib/ballot-share-image", () => ({
  BALLOT_SHARE_WIDTH: 1080,
  BALLOT_SHARE_HEIGHT: 1350,
  BallotShareImage: () => null,
}));

import { GET } from "@/app/api/vote/college/[sport]/rankings/[division]/share-image/route";

const params = Promise.resolve({ sport: "football", division: "fbs" });

describe("GET /api/vote/college/[sport]/rankings/[division]/share-image", () => {
  beforeEach(() => {
    mockAuth.mockReset().mockResolvedValue({ userId: "user-1" });
    mockRatelimit.mockReset().mockResolvedValue({ success: true });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockGetVotingSeasonInfoBySportIds.mockReset().mockResolvedValue(
      new Map([
        [
          "sport_football",
          {
            sportId: "sport_football",
            year: 2025,
            votingWeek: 5,
            weekId: "week-5",
            isPreseason: false,
            isRegularSeason: true,
            isPostseason: false,
          },
        ],
      ]),
    );
    mockGetVoterBallotSchoolEntries.mockReset().mockResolvedValue([
      {
        teamId: "school-1",
        schoolId: "db-1",
        rank: 1,
        shortName: "Alabama",
        abbreviation: "ALA",
        name: "Alabama",
        image: null,
      },
    ]);
    mockGetUserById.mockReset().mockResolvedValue({
      id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      organization: "Example Media",
      organizationRole: "Writer",
    });
    mockImageResponse.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockRatelimit.mockResolvedValue({ success: false });

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("Too many"),
    });
  });

  it("returns 404 when no ballot exists", async () => {
    mockGetVoterBallotSchoolEntries.mockResolvedValue([]);

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid division", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ sport: "football", division: "invalid" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns a PNG attachment when ballot exists", async () => {
    const res = await GET(new Request("http://localhost"), { params });

    expect(mockImageResponse).toHaveBeenCalled();
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="redshirt-top25-fbs-week5.png"',
    );
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 404 when sport is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("Sport not found"),
    });
  });

  it("returns 404 when season info is missing", async () => {
    mockGetVotingSeasonInfoBySportIds.mockResolvedValue(new Map());

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      error: "Season info not found",
    });
  });

  it("falls back to Voter label when user profile is missing", async () => {
    mockGetUserById.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), { params });
    expect(mockImageResponse).toHaveBeenCalled();
    expect(res.headers.get("Content-Disposition")).toContain(
      "redshirt-top25-fbs-week5.png",
    );
  });

  it("returns 500 for unexpected errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSportIdBySlug.mockRejectedValue(new Error("db down"));

    const res = await GET(new Request("http://localhost"), { params });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      error: "Failed to generate share image",
    });
    errorSpy.mockRestore();
  });
});
