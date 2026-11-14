const { mockPublic, mockGetWire, mockLimit } = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockGetWire: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
  getCachedPortalWire: mockGetWire,
}));
vi.mock("@/server/ratelimit", () => ({
  portalApiRatelimit: { limit: mockLimit },
}));

import {
  GET,
  OPTIONS,
} from "@/app/api/v1/college/[sport]/transfer-portal/[year]/route";

const call = (sport: string, year: string) =>
  GET(
    new Request(
      `https://example.com/api/v1/college/${sport}/transfer-portal/${year}`,
      {
        headers: { "x-forwarded-for": "1.2.3.4" },
      },
    ),
    { params: Promise.resolve({ sport, year }) },
  );

describe("GET /api/v1/college/[sport]/transfer-portal/[year]", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockLimit.mockResolvedValue({ success: true });
    mockGetWire.mockResolvedValue({ v: 1, rows: [] });
  });
  afterEach(() => vi.clearAllMocks());

  it("answers preflight", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("serves the cycle with short edge caching", async () => {
    const res = await call("football", "2026");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ v: 1, rows: [] });
    expect(res.headers.get("cache-control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=86400",
    );
    expect(mockLimit).toHaveBeenCalledWith("portal-api:1.2.3.4");
  });

  it("is a 404 while the portal is hidden, or for a bad sport or year", async () => {
    mockPublic.mockReturnValueOnce(false);
    expect((await call("football", "2026")).status).toBe(404);
    expect((await call("lacrosse", "2026")).status).toBe(404);
    expect((await call("football", "26")).status).toBe(404);
    mockGetWire.mockResolvedValueOnce(null);
    expect((await call("football", "2026")).status).toBe(404);
    expect(mockLimit).toHaveBeenCalledOnce();
  });

  it("still serves when the rate limiter is unreachable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLimit.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect((await call("football", "2026")).status).toBe(200);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("rate limits and reports failures", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect((await call("football", "2026")).status).toBe(429);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetWire.mockRejectedValueOnce(new Error("db down"));
    expect((await call("football", "2026")).status).toBe(500);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
