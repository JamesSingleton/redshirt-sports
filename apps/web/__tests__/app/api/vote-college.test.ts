import {
  ballotBody,
  sampleBallotEntry,
  schoolIdMap,
  seasonInfoInSeason,
  seasonInfoOffSeason,
  TEST_POLL_ID,
  TEST_USER_ID,
  TEST_WEEK_ID,
  testPoll,
  voteParams,
} from "../../helpers/vote-fixtures";

const {
  mockAuth,
  mockGetSportIdBySlug,
  mockGetPollBySportAndSlug,
  mockIsUserAssignedToPoll,
  mockHasVoterVoted,
  mockResolveWeekIdForLegacyWeek,
  mockGetSchoolsBySanityIds,
  mockSubmitBallot,
  mockGetVoterBallots,
  mockGetSeasonInfo,
  mockAnalyticsCapture,
  mockSentryCapture,
  mockRatelimit,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetPollBySportAndSlug: vi.fn(),
  mockIsUserAssignedToPoll: vi.fn(),
  mockHasVoterVoted: vi.fn(),
  mockResolveWeekIdForLegacyWeek: vi.fn(),
  mockGetSchoolsBySanityIds: vi.fn(),
  mockSubmitBallot: vi.fn(),
  mockGetVoterBallots: vi.fn(),
  mockGetSeasonInfo: vi.fn(),
  mockAnalyticsCapture: vi.fn(),
  mockSentryCapture: vi.fn(),
  mockRatelimit: vi.fn(),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: mockAuth,
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getPollBySportAndSlug: mockGetPollBySportAndSlug,
  isUserAssignedToPoll: mockIsUserAssignedToPoll,
  hasVoterVoted: mockHasVoterVoted,
  resolveWeekIdForLegacyWeek: mockResolveWeekIdForLegacyWeek,
  getSchoolsBySanityIds: mockGetSchoolsBySanityIds,
  submitBallot: mockSubmitBallot,
  getVoterBallots: mockGetVoterBallots,
}));

vi.mock("@/utils/espn", () => ({
  getSeasonInfo: mockGetSeasonInfo,
}));

vi.mock("@redshirt-sports/analytics/server", () => ({
  analytics: { capture: mockAnalyticsCapture },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockSentryCapture,
}));

vi.mock("@/server/ratelimit", () => ({
  ratelimit: { limit: mockRatelimit },
}));

import {
  GET,
  POST,
} from "@/app/api/vote/college/[sport]/rankings/[division]/route";

function postRequest(body: unknown) {
  return new Request(
    "http://localhost/api/vote/college/football/rankings/fbs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function getRequest() {
  return new Request(
    "http://localhost/api/vote/college/football/rankings/fbs",
    { method: "GET" },
  );
}

function expectedEntries() {
  return Array.from({ length: 25 }, (_, i) => ({
    schoolId: `db-school-${i + 1}`,
    rank: i + 1,
    points: 25 - i,
  }));
}

function resetHappyPathMocks() {
  mockAuth.mockReset().mockResolvedValue({ userId: TEST_USER_ID });
  mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
  mockGetPollBySportAndSlug.mockReset().mockResolvedValue(testPoll);
  mockIsUserAssignedToPoll.mockReset().mockResolvedValue(true);
  mockHasVoterVoted.mockReset().mockResolvedValue(false);
  mockResolveWeekIdForLegacyWeek.mockReset().mockResolvedValue(TEST_WEEK_ID);
  mockGetSchoolsBySanityIds.mockReset().mockResolvedValue(schoolIdMap());
  mockSubmitBallot.mockReset().mockResolvedValue(undefined);
  mockGetVoterBallots.mockReset().mockResolvedValue([]);
  mockGetSeasonInfo.mockReset().mockResolvedValue(seasonInfoInSeason);
  mockAnalyticsCapture.mockReset();
  mockSentryCapture.mockReset();
  mockRatelimit.mockReset().mockResolvedValue({ success: true });
}

describe("POST /api/vote/college/[sport]/rankings/[division]", () => {
  beforeEach(() => {
    resetHappyPathMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockRatelimit.mockResolvedValue({ success: false });
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid sport in URL", async () => {
    const res = await POST(postRequest(ballotBody({ sport: "baseball" })), {
      params: voteParams("baseball", "fbs"),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid sport/);
  });

  it("returns 400 for invalid division in URL", async () => {
    const res = await POST(postRequest(ballotBody({ division: "d1" })), {
      params: voteParams("football", "d1"),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid division/);
  });

  it("returns 400 when body sport mismatches URL", async () => {
    const res = await POST(
      postRequest(ballotBody({ sport: "mens-basketball" })),
      { params: voteParams() },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Sport mismatch/);
  });

  it("returns 400 when body division mismatches URL", async () => {
    const res = await POST(postRequest(ballotBody({ division: "fcs" })), {
      params: voteParams(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Division mismatch/);
  });

  it("returns 404 when poll is not found", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue(null);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/Poll not found/);
  });

  it("returns 403 when poll is inactive", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      ...testPoll,
      isActive: false,
    });
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/not currently accepting/i);
  });

  it("returns 403 when user is not assigned to the poll", async () => {
    mockIsUserAssignedToPoll.mockResolvedValue(false);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/not assigned/i);
  });

  it("returns 400 during off-season", async () => {
    mockGetSeasonInfo.mockResolvedValue(seasonInfoOffSeason);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.currentPeriod).toBe("off-season");
  });

  it("returns 400 when week cannot be resolved", async () => {
    mockResolveWeekIdForLegacyWeek.mockResolvedValue(null);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unable to resolve week/);
  });

  it("returns 400 when ballot is incomplete", async () => {
    const res = await POST(
      postRequest({ sport: "football", division: "fbs", rank_1: "a" }),
      { params: voteParams() },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request data");
  });

  it("returns 400 when ballot has duplicate teams", async () => {
    const res = await POST(
      postRequest(ballotBody({ rank_2: "sanity-school-1" })),
      { params: voteParams() },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request data");
  });

  it("returns 409 when user already voted", async () => {
    mockHasVoterVoted.mockResolvedValue(true);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already voted/i);
  });

  it("returns 400 for unknown Sanity school ids", async () => {
    mockGetSchoolsBySanityIds.mockResolvedValue(new Map());
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown school id/);
  });

  it("returns 400 for ineligible schools", async () => {
    const map = schoolIdMap();
    map.set("sanity-school-1", {
      id: "db-school-1",
      top25Eligible: false,
    });
    mockGetSchoolsBySanityIds.mockResolvedValue(map);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not eligible/i);
  });

  it("submits ballot and returns 200 on happy path", async () => {
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      sport: "football",
      division: "fbs",
      week: 1,
      year: 2025,
      voteCount: 25,
    });
    expect(mockSubmitBallot).toHaveBeenCalledWith({
      pollId: TEST_POLL_ID,
      userId: TEST_USER_ID,
      weekId: TEST_WEEK_ID,
      entries: expectedEntries(),
    });
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: TEST_USER_ID,
        event: "ballot_submitted",
      }),
    );
  });

  it("returns 400 for Zod validation failures", async () => {
    const res = await POST(
      new Request("http://localhost/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: "football",
          division: "fbs",
          rank_1: 123,
        }),
      }),
      { params: voteParams() },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request data");
    expect(body.details).toBeDefined();
  });
});

describe("GET /api/vote/college/[sport]/rankings/[division]", () => {
  beforeEach(() => {
    resetHappyPathMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(getRequest(), { params: voteParams() });
    expect(res.status).toBe(401);
  });

  it("returns 403 when poll is inactive", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      ...testPoll,
      isActive: false,
    });
    const res = await GET(getRequest(), { params: voteParams() });
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is not assigned", async () => {
    mockIsUserAssignedToPoll.mockResolvedValue(false);
    const res = await GET(getRequest(), { params: voteParams() });
    expect(res.status).toBe(403);
  });

  it("returns hasVoted false when no ballot exists", async () => {
    mockGetVoterBallots.mockResolvedValue([]);
    const res = await GET(getRequest(), { params: voteParams() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasVoted).toBe(false);
    expect(body.voteCount).toBe(0);
  });

  it("returns hasVoted true with votes when ballot exists", async () => {
    mockGetVoterBallots.mockResolvedValue([sampleBallotEntry]);
    const res = await GET(getRequest(), { params: voteParams() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasVoted).toBe(true);
    expect(body.voteCount).toBe(1);
    expect(body.votes).toHaveLength(1);
  });
});
