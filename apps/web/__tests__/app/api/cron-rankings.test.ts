const {
  mockGetSportIdBySlug,
  mockGetCurrentSeasonStartAndEnd,
  mockPublishPollRankingsForWeek,
  mockGetCurrentSeason,
  mockGetCurrentWeek,
} = vi.hoisted(() => ({
  mockGetSportIdBySlug: vi.fn(),
  mockGetCurrentSeasonStartAndEnd: vi.fn(),
  mockPublishPollRankingsForWeek: vi.fn(),
  mockGetCurrentSeason: vi.fn(),
  mockGetCurrentWeek: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getCurrentSeasonStartAndEnd: mockGetCurrentSeasonStartAndEnd,
  publishPollRankingsForWeek: mockPublishPollRankingsForWeek,
}));

vi.mock("@/utils/espn", () => ({
  getCurrentSeason: mockGetCurrentSeason,
  getCurrentWeek: mockGetCurrentWeek,
}));

import { GET } from "@/app/api/cron/college/[sport]/rankings/[division]/route";
import type { SportParam } from "@/utils/espn";

function params(sport: SportParam | "nope" = "football", division = "fbs") {
  return {
    params: Promise.resolve({
      sport: sport as SportParam,
      division,
    }),
  };
}

describe("GET /api/cron/college/[sport]/rankings/[division]", () => {
  beforeEach(() => {
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockGetCurrentSeasonStartAndEnd.mockReset().mockResolvedValue({
      startDate: new Date("2020-01-01"),
      endDate: new Date("2099-12-31"),
    });
    mockGetCurrentSeason.mockReset().mockResolvedValue({ year: 2025 });
    mockGetCurrentWeek.mockReset().mockResolvedValue(1);
    mockPublishPollRankingsForWeek.mockReset().mockResolvedValue({
      teams: 25,
      ballots: 10,
    });
  });

  it("returns 400 for invalid sport", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost"), params("nope"));
    expect(res.status).toBe(400);
  });

  it("skips when current date is outside the season window", async () => {
    mockGetCurrentSeasonStartAndEnd.mockResolvedValue({
      startDate: new Date("2090-01-01"),
      endDate: new Date("2090-12-31"),
    });
    const res = await GET(new Request("http://localhost"), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toMatch(/not within the season/i);
    expect(mockPublishPollRankingsForWeek).not.toHaveBeenCalled();
  });

  it("publishes rankings on success", async () => {
    const res = await GET(new Request("http://localhost"), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.teams).toBe(25);
    expect(body.ballots).toBe(10);
  });

  it("returns 200 with message when there are no ballots", async () => {
    mockPublishPollRankingsForWeek.mockRejectedValue(
      new Error("No ballots found for week"),
    );
    const res = await GET(new Request("http://localhost"), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.response).toMatch(/No ballots/);
  });

  it("returns 404 when poll is not found", async () => {
    mockPublishPollRankingsForWeek.mockRejectedValue(
      new Error("Poll not found"),
    );
    const res = await GET(new Request("http://localhost"), params());
    expect(res.status).toBe(404);
  });
});
