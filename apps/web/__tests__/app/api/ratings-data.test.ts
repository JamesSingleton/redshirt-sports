import { weekModel } from "@/__tests__/helpers/ratings-fixtures";

const { mockLimit, mockLoad, mockLoadSheets } = vi.hoisted(() => ({
  mockLoadSheets: vi.fn(),
  mockLimit: vi.fn(),
  mockLoad: vi.fn(),
}));

vi.mock("@/server/ratelimit", () => ({
  rankingsApiRatelimit: { limit: mockLimit },
}));
vi.mock("@/lib/ratings/data", () => ({
  loadRatingsWeek: mockLoad,
  loadRatingsSheets: mockLoadSheets,
}));

import { GET } from "@/app/api/ratings/[sport]/[pool]/[year]/[week]/route";

const params = Promise.resolve({
  sport: "football",
  pool: "fcs",
  year: "2025",
  week: "postseason",
});
const get = (query = "", headers: Record<string, string> = {}) =>
  GET(
    new Request(
      `https://x.test/api/ratings/football/fcs/2025/postseason${query}`,
      { headers },
    ),
    { params },
  );

describe("GET /api/ratings/[sport]/[pool]/[year]/[week]", () => {
  beforeEach(() => {
    mockLimit.mockReset().mockResolvedValue({ success: true });
    mockLoad.mockReset().mockResolvedValue(weekModel());
    mockLoadSheets.mockReset().mockResolvedValue(weekModel());
  });

  it("is open to anyone, rate-limited per client IP", async () => {
    const res = await get("", { "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(res.status).toBe(200);
    expect(mockLimit).toHaveBeenCalledWith("ratings-data:203.0.113.9");
  });

  it("still serves the file when the rate limiter is down", async () => {
    mockLimit.mockRejectedValue(new Error("redis down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await get()).status).toBe(200);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("returns 429 past the limit, before loading anything", async () => {
    mockLimit.mockResolvedValue({ success: false });
    expect((await get()).status).toBe(429);
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it("returns a licensed, cacheable CSV attachment by default", async () => {
    const res = await get();
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="redshirt-football-fcs-2025-postseason.csv"',
    );
    expect(res.headers.get("cache-control")).toContain("s-maxage=1800");
    const body = await res.text();
    expect(body).toContain("# license: ");
    expect(body).toContain("/college/football/ratings/fcs/2025/postseason");
  });

  it("returns JSON on request", async () => {
    const res = await get("?format=json");
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.pool.slug).toBe("fcs");
    expect(body.teams).toHaveLength(3);
    // Only the JSON download loads every team's explanation.
    expect(mockLoadSheets).toHaveBeenCalled();
    expect(mockLoad).not.toHaveBeenCalled();
  });
});
