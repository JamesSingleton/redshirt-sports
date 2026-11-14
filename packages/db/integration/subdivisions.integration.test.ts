import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  publishedPlayerDocSchema,
  publishedWireRowSchema,
} from "../src/portal/published";
import {
  replaceConferenceSportSubdivisions,
  upsertConferenceFromSanity,
} from "../src/queries/conferences";
import { createPortalPlayer } from "../src/queries/portal-admin";
import { pushPortal } from "../src/queries/portal-publish";
import {
  getSchoolPlacement,
  recordRecruitmentEvent,
} from "../src/queries/recruitments";
import { replaceSchoolConferenceAffiliations } from "../src/queries/schools";
import {
  conferenceSportSubdivisionsTable,
  conferenceSportsTable,
  conferencesTable,
  divisionsTable,
  publishedPlayersTable,
  publishedWireEventsTable,
  recruitmentsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const ids = {
  football: "",
  basketball: "",
  d1: "",
  fbs: "",
  fcs: "",
  midMajor: "",
  bigSky: "",
  montana: "",
};

beforeEach(async () => {
  await resetDatabase();
  const [football, basketball] = await db
    .insert(sportsTable)
    .values([
      { id: randomUUID(), slug: "it-football", name: "Football" },
      { id: randomUUID(), slug: "it-basketball", name: "Basketball" },
    ])
    .returning();
  ids.football = football!.id;
  ids.basketball = basketball!.id;

  const [d1] = await db
    .insert(divisionsTable)
    .values({ name: "NCAA DI", slug: "d1", sanityId: "sanity-d1" })
    .returning();
  ids.d1 = d1!.id;
  const subdivisions = await db
    .insert(divisionsTable)
    .values(
      [
        ["fbs", "sanity-fbs"],
        ["fcs", "sanity-fcs"],
        ["mid-major", "sanity-mid-major"],
      ].map(([slug, sanityId]) => ({
        name: slug,
        slug,
        sanityId,
        isSubdivision: true,
        parentDivisionId: ids.d1,
      })),
    )
    .returning();
  ids.fbs = subdivisions[0]!.id;
  ids.fcs = subdivisions[1]!.id;
  ids.midMajor = subdivisions[2]!.id;

  const [bigSky] = await db
    .insert(conferencesTable)
    .values({
      name: "Big Sky",
      sanityId: "sanity-big-sky",
      divisionId: ids.d1,
      logo: { asset: "kept" },
    })
    .returning();
  ids.bigSky = bigSky!.id;
  const [montana] = await db
    .insert(schoolsTable)
    .values({ name: "Montana", sanityId: "sanity-montana" })
    .returning();
  ids.montana = montana!.id;
});

const subdivisionsOf = (conferenceId: string) =>
  db
    .select({
      sportId: conferenceSportSubdivisionsTable.sportId,
      subdivisionId: conferenceSportSubdivisionsTable.subdivisionId,
    })
    .from(conferenceSportSubdivisionsTable)
    .where(eq(conferenceSportSubdivisionsTable.conferenceId, conferenceId));

describe("replaceConferenceSportSubdivisions", () => {
  it("maps Sanity subdivisions per sport, skipping unknown ones", async () => {
    const result = await replaceConferenceSportSubdivisions(db, ids.bigSky, [
      { sportId: ids.football, subdivisionId: "sanity-fcs" },
      { sportId: ids.basketball, subdivisionId: "sanity-mid-major" },
      { sportId: ids.football, subdivisionId: "sanity-fbs" },
      { sportId: ids.basketball, subdivisionId: "sanity-not-loaded" },
      { sportId: "no-such-sport", subdivisionId: "sanity-fcs" },
    ]);

    expect(result.replaced).toBe(2);
    expect(result.skipped).toEqual([
      { sportId: ids.basketball, subdivisionId: "sanity-not-loaded" },
      { sportId: "no-such-sport", subdivisionId: "sanity-fcs" },
    ]);
    expect(await subdivisionsOf(ids.bigSky)).toEqual(
      expect.arrayContaining([
        { sportId: ids.football, subdivisionId: ids.fcs },
        { sportId: ids.basketball, subdivisionId: ids.midMajor },
      ]),
    );
  });

  it("replaces what was there", async () => {
    await replaceConferenceSportSubdivisions(db, ids.bigSky, [
      { sportId: ids.football, subdivisionId: "sanity-fcs" },
    ]);
    await replaceConferenceSportSubdivisions(db, ids.bigSky, [
      { sportId: ids.football, subdivisionId: "sanity-fbs" },
    ]);
    expect(await subdivisionsOf(ids.bigSky)).toEqual([
      { sportId: ids.football, subdivisionId: ids.fbs },
    ]);
  });
});

describe("upsertConferenceFromSanity", () => {
  it("creates a new conference with its level, sports, and subdivisions", async () => {
    const result = await upsertConferenceFromSanity({
      sanityId: "sanity-uac",
      name: "United Athletic Conference",
      shortName: "UAC",
      divisionSanityId: "sanity-d1",
      sportIds: [ids.football, "no-such-sport"],
      subdivisions: [{ sportId: ids.football, subdivisionId: "sanity-fcs" }],
    });

    expect(result).toMatchObject({
      action: "inserted",
      divisionFound: true,
      sports: 1,
      subdivisions: { replaced: 1, skipped: [] },
    });
    const [row] = await db
      .select()
      .from(conferencesTable)
      .where(eq(conferencesTable.id, result.id));
    expect(row).toMatchObject({
      name: "United Athletic Conference",
      divisionId: ids.d1,
    });
    expect(await subdivisionsOf(result.id)).toEqual([
      { sportId: ids.football, subdivisionId: ids.fcs },
    ]);
  });

  it("updates an existing conference and keeps its logo and level", async () => {
    await db
      .insert(conferenceSportsTable)
      .values({ conferenceId: ids.bigSky, sportId: ids.basketball });

    const result = await upsertConferenceFromSanity({
      sanityId: "sanity-big-sky",
      name: "Big Sky Conference",
      divisionSanityId: "sanity-not-loaded",
    });

    expect(result).toMatchObject({
      action: "updated",
      id: ids.bigSky,
      divisionFound: false,
      sports: null,
      subdivisions: null,
    });
    const [row] = await db
      .select()
      .from(conferencesTable)
      .where(eq(conferencesTable.id, ids.bigSky));
    expect(row).toMatchObject({
      name: "Big Sky Conference",
      divisionId: ids.d1,
      logo: { asset: "kept" },
    });
    // Sports weren't sent, so they stay.
    expect(
      await db
        .select()
        .from(conferenceSportsTable)
        .where(eq(conferenceSportsTable.conferenceId, ids.bigSky)),
    ).toHaveLength(1);
  });
});

describe("a school's subdivision", () => {
  const placeMontana = async (override?: string) => {
    await replaceConferenceSportSubdivisions(db, ids.bigSky, [
      { sportId: ids.football, subdivisionId: "sanity-fcs" },
    ]);
    return replaceSchoolConferenceAffiliations(ids.montana, [
      {
        conferenceId: "sanity-big-sky",
        sportId: ids.football,
        subdivisionOverrideId: override,
      },
    ]);
  };

  it("is its conference's for the sport", async () => {
    await placeMontana();
    await expect(
      getSchoolPlacement(db, ids.montana, ids.football),
    ).resolves.toEqual({
      conferenceId: ids.bigSky,
      divisionId: ids.d1,
      subdivisionId: ids.fcs,
    });
  });

  it("is the school's own override when it has one", async () => {
    const result = await placeMontana("sanity-fbs");
    expect(result.unknownSubdivisions).toEqual([]);
    await expect(
      getSchoolPlacement(db, ids.montana, ids.football),
    ).resolves.toMatchObject({ subdivisionId: ids.fbs });
  });

  it("falls back to the conference when the override isn't loaded", async () => {
    const result = await placeMontana("sanity-not-loaded");
    expect(result.unknownSubdivisions).toEqual(["sanity-not-loaded"]);
    await expect(
      getSchoolPlacement(db, ids.montana, ids.football),
    ).resolves.toMatchObject({ subdivisionId: ids.fcs });
  });

  it("is null for a sport the conference has no subdivision in, or no school", async () => {
    await replaceSchoolConferenceAffiliations(ids.montana, [
      { conferenceId: "sanity-big-sky", sportId: ids.basketball },
    ]);
    await expect(
      getSchoolPlacement(db, ids.montana, ids.basketball),
    ).resolves.toEqual({
      conferenceId: ids.bigSky,
      divisionId: ids.d1,
      subdivisionId: null,
    });
    await expect(getSchoolPlacement(db, null, ids.football)).resolves.toEqual({
      conferenceId: null,
      divisionId: null,
      subdivisionId: null,
    });
  });
});

describe("the published portal", () => {
  it("carries each move's subdivision, snapshotted when it was saved", async () => {
    await replaceConferenceSportSubdivisions(db, ids.bigSky, [
      { sportId: ids.football, subdivisionId: "sanity-fcs" },
    ]);
    await replaceSchoolConferenceAffiliations(ids.montana, [
      { conferenceId: "sanity-big-sky", sportId: ids.football },
    ]);
    const [idaho] = await db
      .insert(schoolsTable)
      .values({ name: "Idaho", sanityId: "sanity-idaho" })
      .returning({ id: schoolsTable.id });
    // A program moving up: its own override beats the conference's FCS.
    await replaceSchoolConferenceAffiliations(idaho!.id, [
      {
        conferenceId: "sanity-big-sky",
        sportId: ids.football,
        subdivisionOverrideId: "sanity-fbs",
      },
    ]);

    const player = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
      entry: {
        sportId: ids.football,
        cycleYear: 2026,
        origin: { schoolId: ids.montana },
        enteredAt: new Date(Date.UTC(2026, 0, 2)),
      },
    });
    const [recruitment] = await db
      .select({ id: recruitmentsTable.id })
      .from(recruitmentsTable);
    await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "committed",
      occurredAt: new Date(Date.UTC(2026, 0, 5)),
      school: { schoolId: idaho!.id },
    });
    await pushPortal({ trigger: "admin" });

    const rows = await db
      .select({ row: publishedWireEventsTable.row })
      .from(publishedWireEventsTable);
    expect(rows).toHaveLength(2);
    for (const { row } of rows) {
      const wire = publishedWireRowSchema.parse(row);
      expect(wire.origin).toMatchObject({
        schoolId: ids.montana,
        divisionId: ids.d1,
        subdivisionId: ids.fcs,
      });
      expect(wire.destination).toMatchObject({
        schoolId: idaho!.id,
        subdivisionId: ids.fbs,
      });
    }

    const [published] = await db
      .select({ doc: publishedPlayersTable.doc })
      .from(publishedPlayersTable)
      .where(eq(publishedPlayersTable.playerId, player.id));
    const doc = publishedPlayerDocSchema.parse(published!.doc);
    expect(doc.sports[0]!.recruitments[0]).toMatchObject({
      origin: { subdivisionId: ids.fcs },
      destination: { subdivisionId: ids.fbs },
    });
  });
});
