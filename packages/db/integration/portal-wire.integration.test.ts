import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPortalPlayer } from "../src/queries/portal-admin";
import { pushPortal } from "../src/queries/portal-publish";
import {
  getPublishedWire,
  listPublishedWireCycles,
} from "../src/queries/portal-wire";
import {
  openRecruitment,
  recordRecruitmentEvent,
} from "../src/queries/recruitments";
import {
  conferenceSportSubdivisionsTable,
  conferencesTable,
  divisionsTable,
  publishedWireEventsTable,
  recruitmentsTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const day = (n: number, year = 2026) => new Date(Date.UTC(year, 0, n));
const ids = {
  football: "",
  basketball: "",
  d1: "",
  fcs: "",
  bigSky: "",
  montana: "",
  idaho: "",
};

beforeEach(async () => {
  await resetDatabase();
  ids.football = randomUUID();
  ids.basketball = randomUUID();
  await db.insert(sportsTable).values([
    { id: ids.football, slug: "football", name: "Football" },
    { id: ids.basketball, slug: "mens-basketball", name: "Men's Basketball" },
  ]);
  const [d1] = await db
    .insert(divisionsTable)
    .values({ name: "NCAA DI", slug: "d1" })
    .returning({ id: divisionsTable.id });
  const [fcs] = await db
    .insert(divisionsTable)
    .values({
      name: "FCS",
      slug: "fcs",
      isSubdivision: true,
      parentDivisionId: d1!.id,
    })
    .returning({ id: divisionsTable.id });
  ids.d1 = d1!.id;
  ids.fcs = fcs!.id;
  const [bigSky] = await db
    .insert(conferencesTable)
    .values({
      name: "Big Sky Conference",
      shortName: "Big Sky",
      divisionId: ids.d1,
    })
    .returning({ id: conferencesTable.id });
  ids.bigSky = bigSky!.id;
  await db.insert(conferenceSportSubdivisionsTable).values({
    conferenceId: ids.bigSky,
    sportId: ids.football,
    subdivisionId: ids.fcs,
  });
  const schools = await db
    .insert(schoolsTable)
    .values([
      {
        name: "University of Montana",
        shortName: "Montana",
        slug: "montana",
        image: {
          _type: "image",
          alt: "University of Montana",
          caption: "University of Montana",
          preview: "data:image/png;base64,AAAA",
          asset: { _ref: "image-abc-200x200-svg", _type: "reference" },
          width: 200,
          height: 200,
          crop: null,
          hotspot: null,
        },
      },
      { name: "University of Idaho", shortName: "Idaho" },
    ])
    .returning({ id: schoolsTable.id });
  ids.montana = schools[0]!.id;
  ids.idaho = schools[1]!.id;
  await db.insert(schoolConferenceAffiliationsTable).values(
    [ids.montana, ids.idaho].map((schoolId) => ({
      schoolId,
      sportId: ids.football,
      conferenceId: ids.bigSky,
    })),
  );
});

async function enterAndCommit(
  lastName: string,
  { cycleYear = 2026, sportId = ids.football } = {},
) {
  await createPortalPlayer({
    firstName: "Test",
    lastName,
    highSchoolName: "Sentinel",
    hometownCity: "Missoula",
    hometownState: "MT",
    entry: {
      sportId,
      cycleYear,
      origin: { schoolId: ids.montana },
      enteredAt: day(2, cycleYear),
    },
  });
  const [recruitment] = await db
    .select({ id: recruitmentsTable.id })
    .from(recruitmentsTable)
    .orderBy(sql`${recruitmentsTable.id} desc`)
    .limit(1);
  await recordRecruitmentEvent({
    recruitmentId: recruitment!.id,
    type: "committed",
    occurredAt: day(5, cycleYear),
    school: { schoolId: ids.idaho },
  });
}

describe("getPublishedWire", () => {
  it("is null for an unknown sport and empty before anything is pushed", async () => {
    expect(await getPublishedWire("lacrosse", 2026)).toBeNull();
    expect(await getPublishedWire("football", 2026)).toMatchObject({
      v: 1,
      sport: { slug: "football", name: "Football" },
      cycleYear: 2026,
      rows: [],
      schools: {},
      conferences: {},
    });
    await enterAndCommit("Unpushed");
    expect((await getPublishedWire("football", 2026))!.rows).toEqual([]);
  });

  it("lists moves newest first with the schools, levels, and conferences they name", async () => {
    await enterAndCommit("Brooks");
    await pushPortal({ trigger: "admin" });

    const wire = await getPublishedWire("football", 2026);
    expect(wire!.rows.map((row) => row.type)).toEqual(["committed", "entered"]);
    expect(wire!.rows[0]).toMatchObject({
      lastName: "Brooks",
      highSchoolName: "Sentinel",
      hometownCity: "Missoula",
      hometownState: "MT",
      schoolId: ids.idaho,
      origin: {
        schoolId: ids.montana,
        divisionId: ids.d1,
        subdivisionId: ids.fcs,
      },
    });
    expect(wire!.schools[ids.montana]).toEqual({
      name: "University of Montana",
      shortName: "Montana",
      abbreviation: null,
      slug: "montana",
      // No alt, caption, preview, or nulls: just what the logo needs.
      image: {
        asset: { _ref: "image-abc-200x200-svg", _type: "reference" },
        width: 200,
        height: 200,
      },
    });
    expect(wire!.schools[ids.idaho]).toMatchObject({ image: null });
    expect(wire!.levels).toEqual({
      [ids.d1]: { name: "NCAA DI", slug: "d1", parentId: null },
      [ids.fcs]: { name: "FCS", slug: "fcs", parentId: ids.d1 },
    });
    expect(wire!.conferences).toEqual({
      [ids.bigSky]: { name: "Big Sky Conference", shortName: "Big Sky" },
    });
  });

  it("offers the sport's whole level tree before anyone has moved", async () => {
    // FBS through another conference; no FBS player on the wire.
    const [fbs] = await db
      .insert(divisionsTable)
      .values({
        name: "FBS",
        slug: "fbs",
        isSubdivision: true,
        parentDivisionId: ids.d1,
      })
      .returning({ id: divisionsTable.id });
    const [mw] = await db
      .insert(conferencesTable)
      .values({ name: "Mountain West", divisionId: ids.d1 })
      .returning({ id: conferencesTable.id });
    await db.insert(conferenceSportSubdivisionsTable).values({
      conferenceId: mw!.id,
      sportId: ids.football,
      subdivisionId: fbs!.id,
    });
    const wire = await getPublishedWire("football", 2026);
    expect(wire!.rows).toEqual([]);
    expect(wire!.levels).toEqual({
      [ids.d1]: { name: "NCAA DI", slug: "d1", parentId: null },
      [fbs!.id]: { name: "FBS", slug: "fbs", parentId: ids.d1 },
      [ids.fcs]: { name: "FCS", slug: "fcs", parentId: ids.d1 },
    });
    // Basketball's conferences have no subdivisions here: nothing to offer.
    expect((await getPublishedWire("mens-basketball", 2026))!.levels).toEqual(
      {},
    );
  });

  it("publishes the schools a player was at before the one they're leaving", async () => {
    const [boise] = await db
      .insert(schoolsTable)
      .values({ name: "Boise State", shortName: "Boise State" })
      .returning({ id: schoolsTable.id });
    const player = await createPortalPlayer({
      firstName: "Journey",
      lastName: "Man",
    });
    const move = async (
      cycleYear: number,
      from: string,
      to: string,
      enroll = true,
    ) => {
      await openRecruitment({
        playerId: player.id,
        sportId: ids.football,
        cycleYear,
        origin: { schoolId: from },
        originStartYear: cycleYear - 2,
        enteredAt: day(2, cycleYear),
      });
      const [recruitment] = await db
        .select({ id: recruitmentsTable.id })
        .from(recruitmentsTable)
        .orderBy(sql`${recruitmentsTable.id} desc`)
        .limit(1);
      await recordRecruitmentEvent({
        recruitmentId: recruitment!.id,
        type: "committed",
        occurredAt: day(5, cycleYear),
        school: { schoolId: to },
      });
      if (enroll) {
        await recordRecruitmentEvent({
          recruitmentId: recruitment!.id,
          type: "enrolled",
          occurredAt: day(20, cycleYear),
          school: { schoolId: to },
        });
      }
    };
    // Montana → Idaho (2024), Idaho → Boise State (2025), Boise State → Montana (2026).
    await move(2024, ids.montana, ids.idaho);
    await move(2025, ids.idaho, boise!.id);
    await move(2026, boise!.id, ids.montana, false);
    await pushPortal({ trigger: "admin" });

    const pathOf = async (year: number) =>
      (await getPublishedWire("football", year))!.rows.find(
        (row) => row.lastName === "Man",
      )!;
    expect((await pathOf(2024)).path).toBeUndefined();
    expect((await pathOf(2025)).path).toEqual([{ schoolId: ids.montana }]);
    const latest = await pathOf(2026);
    expect(latest.path).toEqual([
      { schoolId: ids.montana },
      { schoolId: ids.idaho },
    ]);
    expect(latest.origin.schoolId).toBe(boise!.id);
    // Earlier schools are in the wire's school dictionary.
    expect(
      Object.keys((await getPublishedWire("football", 2026))!.schools).sort(),
    ).toEqual([boise!.id, ids.idaho, ids.montana].sort());
  });

  it("keeps to one sport and cycle", async () => {
    await enterAndCommit("Football2026");
    await enterAndCommit("Football2027", { cycleYear: 2027 });
    await enterAndCommit("Hoops", { sportId: ids.basketball });
    await pushPortal({ trigger: "admin" });

    const names = async (sport: string, year: number) =>
      (await getPublishedWire(sport, year))!.rows.map((row) => row.lastName);
    expect(new Set(await names("football", 2026))).toEqual(
      new Set(["Football2026"]),
    );
    expect(new Set(await names("football", 2027))).toEqual(
      new Set(["Football2027"]),
    );
    expect(new Set(await names("mens-basketball", 2026))).toEqual(
      new Set(["Hoops"]),
    );
  });

  it("skips a row it can't read instead of failing the wire", async () => {
    await enterAndCommit("Brooks");
    await pushPortal({ trigger: "admin" });
    const [first] = await db
      .select({ eventId: publishedWireEventsTable.eventId })
      .from(publishedWireEventsTable)
      .limit(1);
    await db
      .update(publishedWireEventsTable)
      .set({ row: { v: 99 } })
      .where(eq(publishedWireEventsTable.eventId, first!.eventId));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await getPublishedWire("football", 2026))!.rows).toHaveLength(1);
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});

describe("listPublishedWireCycles", () => {
  it("lists a sport's published cycles, newest first", async () => {
    expect(await listPublishedWireCycles("football")).toEqual([]);
    await enterAndCommit("A", { cycleYear: 2025 });
    await enterAndCommit("B", { cycleYear: 2027 });
    await enterAndCommit("C", { cycleYear: 2026 });
    await enterAndCommit("D", { sportId: ids.basketball, cycleYear: 2024 });
    await pushPortal({ trigger: "admin" });
    expect(await listPublishedWireCycles("football")).toEqual([
      2027, 2026, 2025,
    ]);
    expect(await listPublishedWireCycles("mens-basketball")).toEqual([2024]);
    expect(await listPublishedWireCycles("lacrosse")).toEqual([]);
  });
});
