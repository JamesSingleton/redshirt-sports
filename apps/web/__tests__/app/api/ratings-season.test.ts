import { weekModel } from "@/__tests__/helpers/ratings-fixtures";

const { mockLimit, mockLoad } = vi.hoisted(() => ({
  mockLimit: vi.fn(),
  mockLoad: vi.fn(),
}));

vi.mock("@/server/ratelimit", () => ({
  rankingsApiRatelimit: { limit: mockLimit },
}));
vi.mock("@/lib/ratings/data", () => ({ loadRatingsSeasonRuns: mockLoad }));

import { GET } from "@/app/api/ratings/[sport]/[pool]/[year]/route";

const params = Promise.resolve({
  sport: "football",
  pool: "fcs",
  year: "2025",
});
const get = () =>
  GET(new Request("https://x.test/api/ratings/football/fcs/2025"), { params });

describe("GET /api/ratings/[sport]/[pool]/[year]", () => {
  beforeEach(() => {
    mockLimit.mockReset().mockResolvedValue({ success: true });
    const model = weekModel();
    mockLoad.mockReset().mockResolvedValue({
      pool: model.pool,
      weeks: [{ week: model.weeks[0], run: model.run, rows: model.rows }],
    });
  });

  it("returns the season as an Excel attachment", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="redshirt-football-fcs-2025.xlsx"',
    );
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it("rate-limits, and fails open when the limiter is down", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect((await get()).status).toBe(429);
    mockLimit.mockRejectedValueOnce(new Error("redis down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await get()).status).toBe(200);
    error.mockRestore();
  });
});
