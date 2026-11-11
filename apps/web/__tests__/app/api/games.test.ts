const { mockSearch, mockLimit } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  searchGamesForPicker: mockSearch,
}));
vi.mock("@/server/ratelimit", () => ({
  rankingsApiRatelimit: { limit: mockLimit },
}));
vi.mock("@/lib/rankings-api-route", () => ({
  clientIp: () => "1.2.3.4",
}));

import { GET, OPTIONS } from "@/app/api/v1/college/games/route";

const request = (q?: string) =>
  new Request(
    `https://www.redshirtsports.com/api/v1/college/games${q === undefined ? "" : `?q=${encodeURIComponent(q)}`}`,
  );

describe("/api/v1/college/games", () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockLimit.mockReset().mockResolvedValue({ success: true });
  });

  it("answers CORS preflight", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("rejects missing, short, and long searches", async () => {
    for (const q of [undefined, "ab", "x".repeat(61)]) {
      expect((await GET(request(q))).status).toBe(400);
    }
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("rate limits per client", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const res = await GET(request("montana"));
    expect(res.status).toBe(429);
    expect(mockLimit).toHaveBeenCalledWith("games-api:1.2.3.4");
  });

  it("returns matching games with CORS and caching headers", async () => {
    const games = [{ provider: "espn", id: "401", homeName: "Montana State" }];
    mockSearch.mockResolvedValue(games);
    const res = await GET(request("  montana "));
    expect(mockSearch).toHaveBeenCalledWith({ term: "montana" });
    expect(await res.json()).toEqual({ games });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
  });
});
