import {
  ballotBody,
  schoolIdMap,
  seasonInfoInSeason,
  TEST_POLL_ID,
  TEST_USER_ID,
  TEST_WEEK_ID,
  testPoll,
  voteParams,
} from "../helpers/vote-fixtures";

/**
 * Flow: form-shaped ballot body → vote API → submitBallot.
 * Covers the critical submit path without a browser.
 */

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
  analytics: { capture: vi.fn() },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/server/ratelimit", () => ({
  ratelimit: { limit: mockRatelimit },
}));

import { POST } from "@/app/api/vote/college/[sport]/rankings/[division]/route";

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

describe("vote submit flow", () => {
  beforeEach(() => {
    mockAuth.mockReset().mockResolvedValue({ userId: TEST_USER_ID });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockGetPollBySportAndSlug.mockReset().mockResolvedValue(testPoll);
    mockIsUserAssignedToPoll.mockReset().mockResolvedValue(true);
    mockHasVoterVoted.mockReset().mockResolvedValue(false);
    mockResolveWeekIdForLegacyWeek.mockReset().mockResolvedValue(TEST_WEEK_ID);
    mockGetSchoolsBySanityIds.mockReset().mockResolvedValue(schoolIdMap());
    mockSubmitBallot.mockReset().mockResolvedValue(undefined);
    mockGetSeasonInfo.mockReset().mockResolvedValue(seasonInfoInSeason);
    mockRatelimit.mockReset().mockResolvedValue({ success: true });
  });

  it("accepts a Top25-shaped body and persists via submitBallot", async () => {
    const formBody = ballotBody();
    const res = await POST(postRequest(formBody), { params: voteParams() });

    expect(res.status).toBe(200);
    expect(mockSubmitBallot).toHaveBeenCalledWith({
      pollId: TEST_POLL_ID,
      userId: TEST_USER_ID,
      weekId: TEST_WEEK_ID,
      entries: Array.from({ length: 25 }, (_, i) => ({
        schoolId: `db-school-${i + 1}`,
        rank: i + 1,
        points: 25 - i,
      })),
    });
  });

  it("returns 403 when voter is not assigned to the poll", async () => {
    mockIsUserAssignedToPoll.mockResolvedValue(false);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(403);
    expect(mockSubmitBallot).not.toHaveBeenCalled();
  });

  it("returns 409 on second submit for the same week", async () => {
    mockHasVoterVoted.mockResolvedValue(true);
    const res = await POST(postRequest(ballotBody()), {
      params: voteParams(),
    });
    expect(res.status).toBe(409);
    expect(mockSubmitBallot).not.toHaveBeenCalled();
  });
});
