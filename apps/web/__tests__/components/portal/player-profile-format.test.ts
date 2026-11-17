import {
  formatSchoolCount,
  highSchoolStop,
  journeyStops,
  positionLabel,
  positionPlural,
  profileInterest,
  sideLists,
} from "@/components/portal/player-format";
import {
  playerData,
  playerDoc,
  playerSport,
  recruitment,
} from "../../helpers/portal-player";
import { wireData, wireRow } from "../../helpers/portal-wire";

const data = playerData();

describe("profile words", () => {
  it("names positions and counts", () => {
    expect(positionLabel("football", "QB")).toBe("Quarterback");
    expect(positionLabel("mens-basketball", "C")).toBe("Center");
    expect(positionLabel("lacrosse", "QB")).toBeNull();
    expect(positionLabel("football", "ZZ")).toBeNull();
    expect(positionLabel("football", undefined)).toBeNull();
    expect(formatSchoolCount(1)).toBe("1 school");
    expect(formatSchoolCount(5)).toBe("5 schools");
  });
});

describe("position groups", () => {
  it("spells positions out as a plural group", () => {
    expect(positionPlural("football", "S")).toBe("safeties");
    expect(positionPlural("football", "QB")).toBe("quarterbacks");
    expect(positionPlural("football", "DL")).toBe("defensive linemen");
    expect(positionPlural("football", "IOL")).toBe(
      "interior offensive linemen",
    );
    expect(positionPlural("football", "EDGE")).toBe("edge rushers");
    expect(positionPlural("womens-basketball", "PG")).toBe("point guards");
    // A code we can't spell out never becomes "Ss".
    expect(positionPlural("lacrosse", "S")).toBe("S players");
  });
});

describe("journey", () => {
  const career = playerSport({
    enrollments: [
      { schoolId: "montana", startYear: 2022, endYear: 2023 },
      { schoolName: "Carroll College", startYear: 2024, endYear: 2025 },
      { schoolId: "boise", startYear: 2026 },
    ],
    recruitments: [
      recruitment({
        id: 2,
        cycleYear: 2026,
        status: "enrolled",
        origin: { schoolName: "Carroll College", divisionId: "naia" },
        destination: { schoolId: "boise", subdivisionId: "fbs" },
        events: [
          {
            id: 20,
            type: "entered",
            occurredAt: "2026-01-02T17:00:00.000Z",
            superseded: false,
          },
          {
            id: 21,
            type: "offered",
            occurredAt: "2026-01-03T17:00:00.000Z",
            schoolId: "boise",
            superseded: false,
          },
          {
            id: 22,
            type: "committed",
            occurredAt: "2026-01-05T17:00:00.000Z",
            schoolId: "boise",
            superseded: false,
          },
          {
            id: 23,
            type: "signed",
            occurredAt: "2026-01-06T17:00:00.000Z",
            schoolId: "boise",
            superseded: false,
          },
          {
            id: 24,
            type: "enrolled",
            occurredAt: "2026-01-07T17:00:00.000Z",
            schoolId: "boise",
            superseded: false,
          },
        ],
      }),
      recruitment({
        id: 1,
        cycleYear: 2024,
        status: "enrolled",
        destination: { schoolName: "Carroll College" },
        events: [
          {
            id: 10,
            type: "entered",
            occurredAt: "2024-01-02T17:00:00.000Z",
            superseded: false,
          },
          {
            id: 11,
            type: "committed",
            occurredAt: "2024-01-03T17:00:00.000Z",
            schoolId: "boise",
            superseded: true,
          },
          {
            id: 12,
            type: "decommitted",
            occurredAt: "2024-01-04T17:00:00.000Z",
            schoolId: "boise",
            superseded: false,
          },
          {
            id: 13,
            type: "withdrew",
            occurredAt: "2024-01-05T17:00:00.000Z",
            superseded: false,
          },
        ],
      }),
    ],
  });

  it("lists each school newest first: how they arrived, then how they left", () => {
    const stops = journeyStops(data, career);
    expect(
      stops.map((stop) => [stop.kind, stop.name, stop.years, stop.line]),
    ).toEqual([
      ["school", "Boise State University", "2026–", null],
      ["school", "Carroll College", "2024–25", null],
      ["school", "Montana", "2022–23", null],
    ]);
    const labels = (index: number) =>
      stops[index]!.events.map((event) => [
        event.kind,
        event.label,
        event.superseded,
      ]);
    // Boise: the arrival, without repeating the school's name.
    expect(labels(0)).toEqual([
      ["commit", "Committed", false],
      ["sign", "Signed", false],
      ["enroll", "Enrolled", false],
    ]);
    // Carroll: no arrival moves on record for it, so only how they left.
    expect(labels(1)).toEqual([["portal", "Entered portal", false]]);
    // Montana: left in the 2024 cycle, the season after the stint ended.
    expect(labels(2)).toEqual([
      ["portal", "Entered portal", false],
      ["commit", "Committed to Boise State University", true],
      ["decommit", "Decommitted from Boise State University", false],
      ["withdraw", "Withdrew from portal", false],
    ]);
  });

  it("starts with where they're headed, or Undecided", () => {
    const committed = journeyStops(data, playerSport())[0]!;
    expect(committed).toMatchObject({
      kind: "next",
      name: "Boise State University",
      line: "Next school",
      years: "2026–",
      status: "committed",
    });
    expect(committed.events.map((event) => event.label)).toEqual(["Committed"]);
    const entered = journeyStops(
      data,
      playerSport({ recruitments: [recruitment({ status: "entered" })] }),
    )[0]!;
    expect(entered).toMatchObject({
      kind: "next",
      name: "Undecided",
      view: null,
      line: "In the portal since Jan 2, 2026 · no commitment reported",
    });
    const unknown = journeyStops(
      { ...data, schools: {} },
      playerSport({
        enrollments: [{ startYear: 2023 }],
        recruitments: [
          recruitment({ destination: { schoolName: "" }, status: "signed" }),
        ],
      }),
    );
    expect(unknown[0]).toMatchObject({ name: "Undisclosed school" });
    expect(unknown[1]).toMatchObject({
      name: "Undisclosed school",
      key: "2023-school",
    });
    // Withdrawn: no next stop.
    expect(
      journeyStops(
        data,
        playerSport({ recruitments: [recruitment({ status: "withdrawn" })] }),
      )[0]!.kind,
    ).toBe("school");
    expect(
      journeyStops(data, playerSport({ enrollments: [], recruitments: [] })),
    ).toEqual([]);
  });

  it("ends at high school", () => {
    expect(highSchoolStop(playerDoc({ hsGradYear: 2021 }))).toMatchObject({
      kind: "high-school",
      name: "Sentinel",
      line: "Missoula, MT · high school",
      years: "Class of 2021",
    });
    expect(
      highSchoolStop(
        playerDoc({ hometownCity: undefined, hometownState: undefined }),
      ),
    ).toMatchObject({ line: "high school", years: null });
    expect(highSchoolStop(playerDoc({ highSchoolName: undefined }))).toBeNull();
  });
});

describe("offers and reported interest", () => {
  const at = (day: number) =>
    `2026-01-${String(day).padStart(2, "0")}T17:00:00.000Z`;

  it("gives each school one row, led by the strongest thing reported", () => {
    const sport = playerSport({
      recruitments: [
        recruitment({
          // Committed to Boise.
          offers: [
            {
              eventId: 3,
              occurredAt: at(3),
              schoolId: "boise",
              storySlug: "boise-offers",
            },
            { eventId: 4, occurredAt: at(4), schoolName: "Carroll College" },
          ],
          interest: [
            {
              eventId: 5,
              type: "contacted",
              occurredAt: at(2),
              schoolId: "boise",
            },
            {
              eventId: 6,
              type: "visited",
              occurredAt: at(4),
              schoolId: "boise",
            },
            {
              eventId: 7,
              type: "visit_scheduled",
              occurredAt: at(6),
              schoolId: "montana",
            },
            {
              eventId: 8,
              type: "contacted",
              occurredAt: at(1),
              schoolName: "Carroll College",
            },
            {
              eventId: 9,
              type: "visited",
              occurredAt: at(2),
              schoolName: "Rocky",
            },
            {
              eventId: 10,
              type: "visited",
              occurredAt: at(7),
              schoolName: "Rocky",
              storySlug: "second-rocky-visit",
            },
          ],
        }),
      ],
    });
    const rows = profileInterest(data, sport);
    expect(rows.map((row) => [row.view?.name, row.status, row.date])).toEqual([
      ["Boise State University", "committed", "Jan 5"],
      // The later of two visits leads.
      ["Rocky", "visited", "Jan 7"],
      ["Montana", "visit_scheduled", "Jan 6"],
      ["Carroll College", "offered", "Jan 4"],
    ]);
    // Everything else reported for the school, oldest first.
    expect(rows[0]!.detail).toBe(
      "Reported contact Jan 2 · Offered Jan 3 · Visited Jan 4",
    );
    expect(rows[1]!.detail).toBe("Visited Jan 2");
    expect(rows[2]!.detail).toBeNull();
    expect(rows[3]!.detail).toBe("Reported contact Jan 1");
    // The lead's story, else any story about the school.
    expect(rows[0]!.storySlug).toBe("boise-offers");
    expect(rows[1]!.storySlug).toBe("second-rocky-visit");
    expect(rows[2]!.storySlug).toBeNull();
    expect(rows[0]!.key).toBe("1-boise-state");
  });

  it("doesn't call it committed while they're undecided or withdrawn", () => {
    const offered = (status: "entered" | "withdrawn") =>
      profileInterest(
        data,
        playerSport({ recruitments: [recruitment({ status })] }),
      )[0]!.status;
    expect(offered("entered")).toBe("offered");
    expect(offered("withdrawn")).toBe("offered");
  });

  it("uses the commitment's own story and keeps entries apart", () => {
    const sport = playerSport({
      recruitments: [
        recruitment({
          id: 2,
          cycleYear: 2026,
          events: [
            { id: 20, type: "entered", occurredAt: at(2), superseded: false },
            {
              id: 21,
              type: "committed",
              occurredAt: at(5),
              schoolId: "boise",
              superseded: false,
              storySlug: "why-boise",
            },
          ],
        }),
        recruitment({
          id: 1,
          cycleYear: 2024,
          status: "withdrawn",
          offers: [],
          // A school we can't name still gets its own row.
          interest: [
            { eventId: 30, type: "contacted", occurredAt: at(3) },
            { eventId: 31, type: "contacted", occurredAt: at(4) },
          ],
        }),
      ],
    });
    const rows = profileInterest(data, sport);
    expect(rows.map((row) => [row.key, row.status, row.cycleYear])).toEqual([
      ["2-boise-state", "committed", 2026],
      ["1-undisclosed-31", "contacted", 2024],
      ["1-undisclosed-30", "contacted", 2024],
    ]);
    expect(rows[0]!.storySlug).toBe("why-boise");
    expect(rows[1]!.view).toBeNull();
  });

  it("reads docs published before visits existed", () => {
    const sport = playerSport({
      recruitments: [recruitment({ interest: undefined, offers: [] })],
    });
    expect(profileInterest(data, sport)).toEqual([]);
  });
});

describe("sidebar", () => {
  const me = playerDoc({ id: 100000 });
  const sport = playerSport({ position: "QB" });
  const mine = recruitment();
  const rows = [
    // This player: left out.
    wireRow({ eventId: 100, playerId: 100000, position: "QB" }),
    // Same school, another position.
    wireRow({
      eventId: 1,
      firstName: "Ann",
      lastName: "Lee",
      position: "WR",
      status: "withdrawn",
    }),
    // Same position, another school.
    wireRow({
      eventId: 2,
      firstName: "Bo",
      lastName: "Cole",
      position: "QB",
      status: "committed",
      origin: { schoolName: "Weber", divisionId: "d1", subdivisionId: "fcs" },
      destination: { schoolId: "boise" },
    }),
    // Same position at any level.
    wireRow({
      eventId: 3,
      position: "QB",
      origin: { schoolId: "boise", divisionId: "d1", subdivisionId: "fbs" },
    }),
    // A second move by player 100002: listed once.
    wireRow({
      eventId: 4,
      playerId: 100002,
      recruitmentId: 44,
      firstName: "Bo",
      lastName: "Cole",
      position: "QB",
      origin: { schoolName: "Weber" },
    }),
  ];
  const wire = wireData(rows);

  it("lists others leaving the same school and others at the position", () => {
    const lists = sideLists(wire, me, sport, mine, 2026);
    expect(lists).toHaveLength(2);
    expect(lists[0]).toMatchObject({
      title: "Montana portal moves",
      description: "2026 · Football",
      empty: "No other Montana players in the 2026 portal yet.",
      link: {
        label: "Montana in the tracker",
        href: "/college/football/transfer-portal?school=montana",
      },
    });
    expect(lists[0]!.players).toEqual([
      {
        id: 100001,
        path: "/players/jalen-brooks-100001",
        name: "Ann Lee",
        initials: "AL",
        line: "WR · returning to Montana",
        status: "withdrawn",
      },
    ]);
    expect(lists[1]).toMatchObject({
      title: "More quarterbacks in the portal",
      description: "Football · 2026",
      empty: "No other quarterbacks in the 2026 portal yet.",
      link: {
        label: "Full portal tracker",
        href: "/college/football/transfer-portal?pos=QB",
      },
    });
    expect(lists[1]!.players.map((player) => [player.id, player.line])).toEqual(
      [
        [100002, "QB · Weber → Boise State University"],
        [100003, "QB · Boise State University → undecided"],
      ],
    );
  });

  it("keeps a list with nobody in it, and links past cycles to their page", () => {
    const lists = sideLists(
      wireData([]),
      me,
      sport,
      recruitment({ cycleYear: 2025 }),
      2026,
    );
    expect(lists.map((list) => [list.title, list.players.length])).toEqual([
      ["Montana portal moves", 0],
      ["More quarterbacks in the portal", 0],
    ]);
    expect(lists[1]!.link.href).toBe(
      "/college/football/transfer-portal/2025?pos=QB",
    );
  });

  it("skips a list it can't name", () => {
    expect(
      sideLists(
        wire,
        me,
        playerSport({ position: undefined }),
        recruitment({ origin: {} }),
        2026,
      ),
    ).toEqual([]);
    // A player with no initials to draw still gets a row.
    const blank = sideLists(
      wireData([
        wireRow({
          eventId: 7,
          firstName: "",
          lastName: "",
          position: undefined,
        }),
      ]),
      me,
      sport,
      mine,
      2026,
    );
    expect(blank[0]!.players[0]).toMatchObject({
      initials: "",
      line: "Montana → undecided",
    });
    // Nobody knows where this one came from.
    const nowhere = sideLists(
      wireData([wireRow({ eventId: 9, position: "QB", origin: {} })]),
      me,
      sport,
      mine,
      2026,
    );
    expect(nowhere[1]!.players[0]!.line).toBe("QB · Undisclosed → undecided");
  });
});
