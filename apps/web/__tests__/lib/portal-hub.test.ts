const { mockCycles, mockWire } = vi.hoisted(() => ({
  mockCycles: vi.fn(),
  mockWire: vi.fn(),
}));

vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  getCachedPortalCycles: mockCycles,
  getCachedPortalWire: mockWire,
}));

import { getPortalHubData, latestPortalMoves } from "@/lib/portal-hub";
import { wireData, wireRow } from "../helpers/portal-wire";

const football = wireData([
  wireRow({
    eventId: 3,
    playerId: 100001,
    recruitmentId: 1,
    type: "committed",
    status: "committed",
    occurredAt: "2026-01-09T17:00:00.000Z",
  }),
  wireRow({
    eventId: 1,
    playerId: 100001,
    recruitmentId: 1,
    status: "committed",
    occurredAt: "2026-01-02T17:00:00.000Z",
  }),
  wireRow({
    eventId: 2,
    playerId: 100002,
    recruitmentId: 2,
    occurredAt: "2026-01-05T17:00:00.000Z",
  }),
]);
const hoops = wireData([
  wireRow({
    eventId: 9,
    playerId: 100009,
    recruitmentId: 9,
    type: "withdrew",
    status: "withdrawn",
    occurredAt: "2026-01-07T17:00:00.000Z",
  }),
  // Same instant as football's event 3: the higher event id goes first.
  wireRow({
    eventId: 8,
    playerId: 100008,
    recruitmentId: 8,
    occurredAt: "2026-01-09T17:00:00.000Z",
  }),
]);

describe("latest portal moves", () => {
  const wires = [
    { sport: "football", wire: football },
    { sport: "mens-basketball", wire: hoops },
  ];

  it("lists each player's latest move across sports, newest first", () => {
    expect(
      latestPortalMoves(wires).map((move) => [move.sport, move.row.eventId]),
    ).toEqual([
      ["mens-basketball", 8],
      ["football", 3],
      ["mens-basketball", 9],
      ["football", 2],
    ]);
  });

  it("stops at the limit", () => {
    expect(latestPortalMoves(wires, 2)).toHaveLength(2);
    expect(latestPortalMoves([])).toEqual([]);
  });
});

describe("portal hub data", () => {
  afterEach(() => vi.clearAllMocks());

  it("reads each sport's current cycle from the trackers' cache", async () => {
    mockCycles.mockImplementation(async (sport: string) => ({
      cycles: [],
      current: sport === "football" ? 2026 : 2027,
    }));
    mockWire.mockImplementation(async (sport: string) =>
      sport === "football"
        ? football
        : sport === "mens-basketball"
          ? hoops
          : null,
    );
    const hub = await getPortalHubData();
    expect(mockWire).toHaveBeenCalledWith("football", 2026);
    expect(mockWire).toHaveBeenCalledWith("womens-basketball", 2027);
    // A sport with no data is left out.
    expect(hub.sports).toEqual([
      {
        sport: "football",
        cycleYear: 2026,
        counts: { all: 2, entered: 1, committed: 1, withdrawn: 0 },
      },
      {
        sport: "mens-basketball",
        cycleYear: 2026,
        counts: { all: 2, entered: 1, committed: 0, withdrawn: 1 },
      },
    ]);
    expect(hub.moves).toHaveLength(4);
  });
});
