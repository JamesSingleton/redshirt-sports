import {
  activeFilterCount,
  byStatus,
  chainCaption,
  EMPTY_FILTERS,
  filtersFromSearch,
  filtersToSearch,
  filterWirePlayers,
  formatClass,
  formatHeight,
  formatSize,
  formatWireDate,
  groupWirePlayers,
  levelOptions,
  needsFullWire,
  pageList,
  playerName,
  playerOrigin,
  schoolView,
  share,
  statusTab,
  wireCounts,
  wireSchoolOptions,
} from "@/components/portal/wire-format";
import { wireData, wireRow } from "../../helpers/portal-wire";

describe("wire formatting", () => {
  it("formats dates in one zone, sizes, classes, and years left", () => {
    // 2 AM UTC is still the previous evening in New York.
    expect(formatWireDate("2026-01-06T02:00:00.000Z")).toBe("Jan 5, 2026");
    expect(formatWireDate("2026-01-06T02:00:00.000Z", true)).toBe("Jan 5");
    expect(formatHeight(77)).toBe(`6'5"`);
    expect(formatHeight(undefined)).toBeNull();
    expect(formatSize(wireRow({ heightIn: 74, weightLb: 215 }))).toBe(
      `6'2" / 215`,
    );
    expect(formatSize(wireRow({ weightLb: 215 }))).toBe("215");
    expect(formatSize(wireRow())).toBeNull();
    expect(formatClass("RS-JR")).toBe("R-Jr");
    expect(formatClass("GR")).toBe("Gr");
    expect(formatClass(undefined)).toBeNull();
    expect(playerName(wireRow({ suffix: "Jr." }))).toBe("Jalen Brooks Jr.");
  });

  it("names schools by slug, id, or free text", () => {
    const data = wireData([]);
    expect(schoolView(data, { schoolId: "montana" })).toMatchObject({
      key: "montana",
      name: "Montana",
    });
    expect(schoolView(data, { schoolId: "boise" })).toMatchObject({
      key: "boise-state",
      name: "Boise State University",
    });
    expect(schoolView(data, { schoolId: "gone" })).toEqual({
      key: "gone",
      name: "Unknown school",
      school: null,
    });
    expect(schoolView(data, { schoolName: "Carroll College" })).toEqual({
      key: "name:Carroll College",
      name: "Carroll College",
      school: null,
    });
    expect(schoolView(data, {})).toBeNull();
    expect(schoolView(data, undefined)).toBeNull();
  });

  it("says where a player is from: high school and hometown", () => {
    expect(
      playerOrigin(
        wireRow({
          highSchoolName: "Sentinel",
          hometownCity: "Missoula",
          hometownState: "MT",
        }),
      ),
    ).toBe("Sentinel (Missoula, MT)");
    expect(
      playerOrigin(wireRow({ hometownCity: "Calgary", hometownState: "AB" })),
    ).toBe("Calgary, AB");
    expect(playerOrigin(wireRow({ highSchoolName: "Sentinel" }))).toBe(
      "Sentinel",
    );
    expect(playerOrigin(wireRow())).toBeNull();
  });

  it("captions the new school's tile only when it needs saying", () => {
    expect(chainCaption(wireRow({ status: "withdrawn" }))).toBe("Returning");
    expect(chainCaption(wireRow({ status: "signed" }))).toBe("Signed");
    expect(chainCaption(wireRow({ status: "enrolled" }))).toBe("Enrolled");
    // A grad transfer's cap sits by their name, not under the tile.
    expect(chainCaption(wireRow({ isGradTransfer: true }))).toBeNull();
    expect(chainCaption(wireRow({ status: "committed" }))).toBeNull();
  });
});

describe("levels and schools", () => {
  it("nests subdivisions under their division", () => {
    expect(levelOptions(wireData([]).levels)).toEqual([
      { slug: "naia", name: "NAIA", nested: false },
      { slug: "d1", name: "NCAA DI", nested: false },
      { slug: "fbs", name: "FBS", nested: true },
      { slug: "fcs", name: "FCS", nested: true },
    ]);
    expect(
      levelOptions({ fcs: { name: "FCS", slug: "fcs", parentId: "gone" } }),
    ).toEqual([{ slug: "fcs", name: "FCS", nested: false }]);
  });

  it("offers the schools on the wire, narrowed by level", () => {
    const data = wireData([
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        destination: { schoolId: "boise", subdivisionId: "fbs" },
      }),
      wireRow({
        eventId: 1,
        recruitmentId: 1,
        origin: { schoolName: "Carroll College", divisionId: "naia" },
      }),
    ]);
    expect(wireSchoolOptions(data).map((option) => option.key)).toEqual([
      "boise-state",
      "name:Carroll College",
      "montana",
    ]);
    expect(wireSchoolOptions(data, "fbs").map((option) => option.key)).toEqual([
      "boise-state",
    ]);
    expect(wireSchoolOptions(data, "nope")).toEqual([]);
  });
});

describe("filters in the URL", () => {
  it("round-trips, ignores junk, and caps length", () => {
    const filters = {
      q: "brooks",
      status: "committed" as const,
      position: "QB",
      level: "fcs",
      school: "montana",
      playerClass: "SO",
      gradTransfer: true,
      sort: "name" as const,
      page: 3,
    };
    const search = filtersToSearch(filters);
    expect(search).toBe(
      "?status=committed&q=brooks&division=fcs&school=montana&pos=QB&class=SO&grad=1&sort=name&page=3",
    );
    expect(filtersFromSearch(search)).toEqual(filters);
    expect(filtersToSearch(EMPTY_FILTERS)).toBe("");
    expect(
      filtersFromSearch(
        `?status=nope&sort=up&page=-2&grad=yes&q=${"x".repeat(200)}`,
      ),
    ).toEqual({ ...EMPTY_FILTERS, q: "x".repeat(120) });
  });

  it("counts what narrows the list, and knows when it needs every player", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, q: "a", gradTransfer: true }),
    ).toBe(2);
    expect(needsFullWire(EMPTY_FILTERS)).toBe(false);
    expect(needsFullWire({ ...EMPTY_FILTERS, sort: "oldest" })).toBe(true);
    expect(needsFullWire({ ...EMPTY_FILTERS, page: 2 })).toBe(true);
    expect(needsFullWire({ ...EMPTY_FILTERS, position: "QB" })).toBe(true);
  });
});

describe("players", () => {
  const rows = [
    wireRow({
      eventId: 4,
      recruitmentId: 1,
      lastName: "Zane",
      type: "committed",
      status: "signed",
      schoolId: "boise",
      destination: { schoolId: "boise", subdivisionId: "fbs" },
      position: "QB",
      classAtEntry: "SO",
    }),
    wireRow({
      eventId: 3,
      recruitmentId: 1,
      lastName: "Zane",
      status: "signed",
    }),
    wireRow({
      eventId: 2,
      recruitmentId: 2,
      firstName: "Marcus",
      lastName: "Hill",
      type: "withdrew",
      status: "withdrawn",
      origin: { schoolName: "Carroll College", divisionId: "naia" },
      position: "WR",
    }),
    wireRow({
      eventId: 1,
      recruitmentId: 3,
      firstName: "Adam",
      lastName: "Hill",
      isGradTransfer: true,
    }),
  ];
  const data = wireData(rows);
  const ids = (filters: Partial<typeof EMPTY_FILTERS>) =>
    filterWirePlayers(data, { ...EMPTY_FILTERS, ...filters }).map(
      (player) => player.recruitmentId,
    );

  it("groups moves by player, latest first", () => {
    const players = groupWirePlayers(rows);
    expect(players.map((player) => player.recruitmentId)).toEqual([1, 2, 3]);
    expect(players[0]!.moves.map((move) => move.eventId)).toEqual([4, 3]);
  });

  it("filters on everything but status, and sorts", () => {
    expect(ids({})).toEqual([1, 2, 3]);
    expect(ids({ position: "WR" })).toEqual([2]);
    expect(ids({ playerClass: "SO" })).toEqual([1]);
    expect(ids({ gradTransfer: true })).toEqual([3]);
    expect(ids({ level: "fcs" })).toEqual([1, 3]);
    expect(ids({ level: "fbs" })).toEqual([1]);
    expect(ids({ level: "naia" })).toEqual([2]);
    expect(ids({ level: "nope" })).toEqual([]);
    expect(ids({ school: "boise-state" })).toEqual([1]);
    expect(ids({ school: "montana" })).toEqual([1, 3]);
    expect(ids({ school: "name:Carroll College" })).toEqual([2]);
    expect(ids({ q: "hill" })).toEqual([2, 3]);
    expect(ids({ q: "zane boise" })).toEqual([1]);
    expect(ids({ q: "carroll" })).toEqual([2]);
    expect(ids({ q: "  " })).toEqual([1, 2, 3]);
    expect(ids({ sort: "oldest" })).toEqual([3, 2, 1]);
    // By last name, then first.
    expect(ids({ sort: "name" })).toEqual([3, 2, 1]);
  });

  it("splits players into status tabs and counts them", () => {
    const players = filterWirePlayers(data, EMPTY_FILTERS);
    expect(statusTab("signed")).toBe("committed");
    expect(statusTab("withdrawn")).toBe("withdrawn");
    expect(byStatus(players, "committed").map((p) => p.recruitmentId)).toEqual([
      1,
    ]);
    expect(byStatus(players, "")).toHaveLength(3);
    expect(wireCounts(players)).toEqual({
      all: 3,
      entered: 1,
      committed: 1,
      withdrawn: 1,
    });
  });
});

describe("numbers and pages", () => {
  it("writes shares", () => {
    expect(share(3, 5)).toBe("60%");
    expect(share(9, 354)).toBe("2.5%");
    expect(share(0, 5)).toBe("0%");
    expect(share(0, 0)).toBe("0%");
  });

  it("lists pages around the current one, with gaps", () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(1, 3)).toEqual([1, 2, 3]);
    expect(pageList(1, 36)).toEqual([1, 2, null, 36]);
    expect(pageList(8, 36)).toEqual([1, null, 7, 8, 9, null, 36]);
    expect(pageList(36, 36)).toEqual([1, null, 35, 36]);
  });
});
