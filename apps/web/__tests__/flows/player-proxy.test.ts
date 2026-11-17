import { NextRequest } from "next/server";

const { mockPublic, mockAddress, mockAuthProxy } = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockAddress: vi.fn(),
  mockAuthProxy: vi.fn(),
}));

vi.mock("@/lib/portal-data", () => ({ portalIsPublic: mockPublic }));
vi.mock("@redshirt-sports/db/queries", () => ({
  getPublishedPlayerAddress: mockAddress,
}));
// One address per test file would hide repeat lookups, so don't cache here.
vi.mock("@/lib/player-address-cache", () => ({
  createPlayerAddressCache:
    (load: (id: number) => Promise<unknown>) => (id: number) =>
      load(id),
}));
vi.mock("@redshirt-sports/auth/proxy", () => ({
  authMiddleware: () => mockAuthProxy,
}));

import proxy, { config, handlePlayerProxy } from "@/proxy";

const request = (path: string) =>
  new NextRequest(new URL(path, "https://redshirtsports.com"));

/** `NextResponse.next()` and rewrites mark themselves with these headers. */
const passedThrough = (res: Response) =>
  res.headers.get("x-middleware-next") === "1";
const rewrittenTo = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("player proxy", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockAddress.mockResolvedValue({ id: 100007, slug: "darnell-okafor" });
  });
  afterEach(() => vi.clearAllMocks());

  it("lets the right address through", async () => {
    const res = await handlePlayerProxy(
      request("/players/darnell-okafor-100007"),
    );
    expect(passedThrough(res)).toBe(true);
    expect(mockAddress).toHaveBeenCalledWith(100007);
  });

  it("301s a stale slug, keeping the query string", async () => {
    const res = await handlePlayerProxy(
      request("/players/wrong-name-100007?utm_source=x"),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://redshirtsports.com/players/darnell-okafor-100007?utm_source=x",
    );
  });

  it("301s a merged player to the survivor", async () => {
    mockAddress.mockResolvedValueOnce({ id: 100000, slug: "testy-mcportal" });
    const res = await handlePlayerProxy(
      request("/players/testy-mcportal-100001"),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://redshirtsports.com/players/testy-mcportal-100000",
    );
  });

  it("404s an unknown id, and a malformed one without a lookup", async () => {
    mockAddress.mockResolvedValueOnce(null);
    const unknown = await handlePlayerProxy(request("/players/nobody-999999"));
    expect(unknown.status).toBe(404);
    expect(rewrittenTo(unknown)).toBe("https://redshirtsports.com/_not-found");

    mockAddress.mockClear();
    const malformed = await handlePlayerProxy(request("/players/garbage"));
    expect(malformed.status).toBe(404);
    expect(mockAddress).not.toHaveBeenCalled();
  });

  it("leaves the sitemap, deeper paths, and the bare folder alone", async () => {
    for (const path of [
      "/players/sitemap.xml",
      "/players/darnell-okafor-100007/anything",
      "/players/",
    ]) {
      expect(passedThrough(await handlePlayerProxy(request(path)))).toBe(true);
    }
    expect(mockAddress).not.toHaveBeenCalled();
  });

  it("stays out of the way while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    const res = await handlePlayerProxy(request("/players/garbage"));
    expect(passedThrough(res)).toBe(true);
    expect(mockAddress).not.toHaveBeenCalled();
  });

  it("passes through when the lookup fails, so the page still loads", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockAddress.mockRejectedValueOnce(new Error("db down"));
    const res = await handlePlayerProxy(
      request("/players/darnell-okafor-100007"),
    );
    expect(passedThrough(res)).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("proxy routing", () => {
  afterEach(() => vi.clearAllMocks());

  it("handles player URLs without Clerk and sends the rest to auth", async () => {
    mockPublic.mockReturnValue(true);
    mockAddress.mockResolvedValue(null);
    const event = {} as Parameters<typeof proxy>[1];
    const player = await proxy(request("/players/nobody-999999"), event);
    expect(player?.status).toBe(404);
    expect(mockAuthProxy).not.toHaveBeenCalled();

    mockAuthProxy.mockResolvedValueOnce("auth");
    const vote = request("/vote/college/football/fcs");
    expect(await proxy(vote, event)).toBe("auth");
    expect(mockAuthProxy).toHaveBeenCalledWith(vote, event);
  });

  it("runs on player profiles and the auth paths only", () => {
    expect(config.matcher).toEqual([
      "/players/:slugId",
      "/admin/:path*",
      "/vote/:path*",
      "/onboarding/:path*",
      "/api/vote/:path*",
    ]);
  });
});
