import { cacheLife, cacheTag } from "next/cache";

const { mockEnv, queries } = vi.hoisted(() => ({
  mockEnv: { ENABLE_TRANSFER_PORTAL: "true" as string | undefined },
  queries: {
    getPlayerBySlug: vi.fn(),
    getPlayerPortalHistory: vi.fn(),
    getPortalConferences: vi.fn(),
    getPortalPositions: vi.fn(),
    getPortalStatusCounts: vi.fn(),
    getPortalYears: vi.fn(),
    getSchoolsBySanityIds: vi.fn(),
    getSportBySlug: vi.fn(),
    getTransferPortalEntries: vi.fn(),
    getTransfersBySchool: vi.fn(),
  },
}));

vi.mock("@/env", () => ({ env: mockEnv }));
vi.mock("@redshirt-sports/db/queries", () => queries);

import {
  getCachedPlayer,
  getCachedPortalCounts,
  getCachedPortalEntries,
  getCachedPortalFilterOptions,
  getCachedPortalSport,
  getCachedPortalYears,
  getCachedSchoolTransfers,
  isTransferPortalEnabled,
} from "@/lib/transfer-portal";

const CACHE_LIFE = { stale: 300, revalidate: 3600, expire: 86400 };

describe("transfer portal data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the transfer portal flag", () => {
    mockEnv.ENABLE_TRANSFER_PORTAL = "true";
    expect(isTransferPortalEnabled()).toBe(true);
    mockEnv.ENABLE_TRANSFER_PORTAL = "false";
    expect(isTransferPortalEnabled()).toBe(false);
    mockEnv.ENABLE_TRANSFER_PORTAL = undefined;
    expect(isTransferPortalEnabled()).toBe(false);
  });

  it("caches the sport lookup", async () => {
    queries.getSportBySlug.mockResolvedValue({ id: "sport-1" });
    await expect(getCachedPortalSport("football")).resolves.toEqual({
      id: "sport-1",
    });
    expect(queries.getSportBySlug).toHaveBeenCalledWith("football");
    expect(cacheTag).toHaveBeenCalledWith("transfer-portal");
    expect(cacheLife).toHaveBeenCalledWith(CACHE_LIFE);
  });

  it("caches portal years", async () => {
    queries.getPortalYears.mockResolvedValue([2026, 2025]);
    await expect(getCachedPortalYears("sport-1")).resolves.toEqual([
      2026, 2025,
    ]);
    expect(queries.getPortalYears).toHaveBeenCalledWith("sport-1");
    expect(cacheTag).toHaveBeenCalledWith("transfer-portal");
  });

  it("caches status counts under the wire tag", async () => {
    queries.getPortalStatusCounts.mockResolvedValue({ total: 3 });
    await expect(
      getCachedPortalCounts({
        sport: "football",
        sportId: "sport-1",
        portalYear: 2026,
      }),
    ).resolves.toEqual({ total: 3 });
    expect(queries.getPortalStatusCounts).toHaveBeenCalledWith({
      sportId: "sport-1",
      portalYear: 2026,
    });
    expect(cacheTag).toHaveBeenCalledWith(
      "transfer-portal",
      "transfer-portal:football:2026",
    );
  });

  it("strips the sport slug before querying entries", async () => {
    queries.getTransferPortalEntries.mockResolvedValue({
      entries: [],
      nextCursor: null,
    });
    await getCachedPortalEntries({
      sport: "football",
      sportId: "sport-1",
      portalYear: 2026,
      status: "ENTERED",
    });
    expect(queries.getTransferPortalEntries).toHaveBeenCalledWith({
      sportId: "sport-1",
      portalYear: 2026,
      status: "ENTERED",
    });
    expect(cacheTag).toHaveBeenCalledWith(
      "transfer-portal",
      "transfer-portal:football:2026",
    );
  });

  it("loads positions and conferences together", async () => {
    queries.getPortalPositions.mockResolvedValue(["QB"]);
    queries.getPortalConferences.mockResolvedValue([{ id: "c1" }]);
    await expect(
      getCachedPortalFilterOptions({
        sport: "football",
        sportId: "sport-1",
        portalYear: 2026,
      }),
    ).resolves.toEqual({ positions: ["QB"], conferences: [{ id: "c1" }] });
    expect(queries.getPortalPositions).toHaveBeenCalledWith({
      sportId: "sport-1",
      portalYear: 2026,
    });
    expect(queries.getPortalConferences).toHaveBeenCalledWith("sport-1");
  });

  it("returns null when the player does not exist", async () => {
    queries.getPlayerBySlug.mockResolvedValue(null);
    await expect(getCachedPlayer("nobody")).resolves.toBeNull();
    expect(queries.getPlayerPortalHistory).not.toHaveBeenCalled();
    expect(cacheTag).toHaveBeenCalledWith(
      "transfer-portal",
      "transfer-portal:player:nobody",
    );
  });

  it("returns the player with portal history", async () => {
    queries.getPlayerBySlug.mockResolvedValue({ id: "player-1" });
    queries.getPlayerPortalHistory.mockResolvedValue([{ id: "entry-1" }]);
    await expect(getCachedPlayer("jane-doe")).resolves.toEqual({
      player: { id: "player-1" },
      history: [{ id: "entry-1" }],
    });
    expect(queries.getPlayerPortalHistory).toHaveBeenCalledWith("player-1");
  });

  it("returns null when the school is not in Postgres", async () => {
    queries.getSchoolsBySanityIds.mockResolvedValue(new Map());
    await expect(getCachedSchoolTransfers("sanity-1")).resolves.toBeNull();
    expect(queries.getSchoolsBySanityIds).toHaveBeenCalledWith(["sanity-1"]);
    expect(queries.getTransfersBySchool).not.toHaveBeenCalled();
  });

  it("tags and loads transfers for a known school", async () => {
    queries.getSchoolsBySanityIds.mockResolvedValue(
      new Map([["sanity-1", { id: "school-1" }]]),
    );
    queries.getTransfersBySchool.mockResolvedValue({
      incoming: [],
      outgoing: [],
    });
    await expect(getCachedSchoolTransfers("sanity-1")).resolves.toEqual({
      incoming: [],
      outgoing: [],
    });
    expect(cacheTag).toHaveBeenCalledWith("transfer-portal:school:school-1");
    expect(queries.getTransfersBySchool).toHaveBeenCalledWith({
      schoolId: "school-1",
    });
  });
});
