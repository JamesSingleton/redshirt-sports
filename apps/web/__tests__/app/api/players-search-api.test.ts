const { mockPublic, mockLimit, mockSearch } = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockLimit: vi.fn(),
  mockSearch: vi.fn(),
}));

vi.mock("@/lib/portal-data", () => ({ portalIsPublic: mockPublic }));
vi.mock("@/server/ratelimit", () => ({
  portalApiRatelimit: { limit: mockLimit },
}));
vi.mock("@redshirt-sports/db/queries", () => ({
  searchPublishedPlayers: mockSearch,
}));

import { GET, OPTIONS } from "@/app/api/v1/players/search/route";

const get = (query: string) =>
  GET(new Request(`https://redshirtsports.com/api/v1/players/search${query}`));

describe("player search API", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockLimit.mockResolvedValue({ success: true });
    mockSearch.mockResolvedValue([{ id: 100007, slug: "darnell-okafor" }]);
  });
  afterEach(() => vi.clearAllMocks());

  it("returns published players for the Studio picker, cached briefly", async () => {
    const res = await get("?q=%20okafor%20");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      players: [{ id: 100007, slug: "darnell-okafor" }],
    });
    expect(mockSearch).toHaveBeenCalledWith("okafor");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });

  it("wants 3 to 60 characters", async () => {
    expect((await get("?q=ok")).status).toBe(400);
    expect((await get("")).status).toBe(400);
    expect((await get(`?q=${"x".repeat(61)}`)).status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("rate limits, failing open when the limiter is down", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect((await get("?q=okafor")).status).toBe(429);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLimit.mockRejectedValueOnce(new Error("redis down"));
    expect((await get("?q=okafor")).status).toBe(200);
    warn.mockRestore();
  });

  it("is a 404 while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect((await get("?q=okafor")).status).toBe(404);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("answers CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
