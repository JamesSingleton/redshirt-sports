const {
  mockEnv,
  mockCacheTag,
  mockCacheLife,
  mockGetWire,
  mockListCycles,
  mockGetPlayer,
  mockListIndexable,
} = vi.hoisted(() => ({
  mockEnv: { PORTAL_PUBLIC: undefined as string | undefined },
  mockCacheTag: vi.fn(),
  mockCacheLife: vi.fn(),
  mockGetWire: vi.fn(),
  mockListCycles: vi.fn(),
  mockGetPlayer: vi.fn(),
  mockListIndexable: vi.fn(),
}));

vi.mock("@/env", () => ({ env: mockEnv }));
vi.mock("next/cache", () => ({
  cacheTag: mockCacheTag,
  cacheLife: mockCacheLife,
}));
vi.mock("@redshirt-sports/db/queries", () => ({
  getPublishedWire: mockGetWire,
  listPublishedWireCycles: mockListCycles,
  getPublishedPlayer: mockGetPlayer,
  listIndexablePlayers: mockListIndexable,
}));

import {
  getCachedIndexablePlayers,
  getCachedPortalCycles,
  getCachedPortalPlayer,
  getCachedPortalWire,
  isPortalSport,
  PORTAL_CACHE_LIFE,
  parseCycleYear,
  portalIsPublic,
  portalWireJsonPath,
  portalWirePath,
} from "@/lib/portal-data";

describe("portal data", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("is public only when PORTAL_PUBLIC is exactly true", () => {
    mockEnv.PORTAL_PUBLIC = undefined;
    expect(portalIsPublic()).toBe(false);
    mockEnv.PORTAL_PUBLIC = "false";
    expect(portalIsPublic()).toBe(false);
    mockEnv.PORTAL_PUBLIC = "true";
    expect(portalIsPublic()).toBe(true);
  });

  it("knows its sports, years, and paths", () => {
    expect(isPortalSport("football")).toBe(true);
    expect(isPortalSport("womens-basketball")).toBe(true);
    expect(isPortalSport("lacrosse")).toBe(false);
    expect(parseCycleYear("2026")).toBe(2026);
    expect(parseCycleYear("1999")).toBeNull();
    expect(parseCycleYear("2101")).toBeNull();
    expect(parseCycleYear("26")).toBeNull();
    expect(parseCycleYear("2026.5")).toBeNull();
    expect(portalWirePath("football")).toBe(
      "/college/football/transfer-portal",
    );
    expect(portalWirePath("football", 2025)).toBe(
      "/college/football/transfer-portal/2025",
    );
    expect(portalWireJsonPath("football", 2026)).toBe(
      "/api/v1/college/football/transfer-portal/2026",
    );
  });

  it("caches one wire per sport and cycle under its push tag", async () => {
    mockGetWire.mockResolvedValue({ rows: [] });
    expect(await getCachedPortalWire("football", 2026)).toEqual({ rows: [] });
    expect(mockCacheTag).toHaveBeenCalledWith("portal:football:2026");
    expect(mockCacheLife).toHaveBeenCalledWith(PORTAL_CACHE_LIFE);
    expect(mockGetWire).toHaveBeenCalledWith("football", 2026);
  });

  it("defaults to the newest published cycle, else the current one", async () => {
    mockListCycles.mockResolvedValueOnce([2026, 2025]);
    expect(await getCachedPortalCycles("football")).toEqual({
      cycles: [2026, 2025],
      current: 2026,
    });
    expect(mockCacheTag).toHaveBeenCalledWith("portal:players");

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 13)));
    mockListCycles.mockResolvedValueOnce([]);
    expect(await getCachedPortalCycles("football")).toEqual({
      cycles: [],
      current: 2027,
    });
  });

  it("caches each player page under that player's tag alone", async () => {
    mockGetPlayer.mockResolvedValue(null);
    expect(await getCachedPortalPlayer(100000)).toBeNull();
    expect(mockCacheTag).toHaveBeenCalledWith("player:100000");
    expect(mockGetPlayer).toHaveBeenCalledWith(100000);
  });

  it("caches the indexable players under the index tag", async () => {
    mockListIndexable.mockResolvedValue([
      {
        id: 100000,
        slug: "jalen-brooks",
        publishedAt: new Date("2026-01-06T00:00:00.000Z"),
      },
    ]);
    expect(await getCachedIndexablePlayers()).toEqual([
      {
        id: 100000,
        slug: "jalen-brooks",
        publishedAt: "2026-01-06T00:00:00.000Z",
      },
    ]);
    expect(mockCacheTag).toHaveBeenCalledWith("portal:players");
  });
});
