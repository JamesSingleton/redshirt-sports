import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { replaceSchoolConferenceAffiliations } from "../src/queries/schools";
import {
  conferencesTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

let schoolId: string;
let otherSchoolId: string;
const sport = { football: "", basketball: "" };
const conference = { bigSky: "", mvfc: "" };

beforeEach(async () => {
  await resetDatabase();
  const sports = await db
    .insert(sportsTable)
    .values([
      { id: randomUUID(), slug: "it-football", name: "Football" },
      { id: randomUUID(), slug: "it-basketball", name: "Basketball" },
    ])
    .returning();
  sport.football = sports[0]!.id;
  sport.basketball = sports[1]!.id;

  const conferences = await db
    .insert(conferencesTable)
    .values([
      { name: "Big Sky", sanityId: "sanity-big-sky" },
      { name: "MVFC", sanityId: "sanity-mvfc" },
    ])
    .returning();
  conference.bigSky = conferences[0]!.id;
  conference.mvfc = conferences[1]!.id;

  const schools = await db
    .insert(schoolsTable)
    .values([
      { name: "Montana", sanityId: "sanity-montana" },
      { name: "North Dakota State", sanityId: "sanity-ndsu" },
    ])
    .returning();
  schoolId = schools[0]!.id;
  otherSchoolId = schools[1]!.id;
});

const affiliationsOf = (id: string) =>
  db
    .select({
      sportId: schoolConferenceAffiliationsTable.sportId,
      conferenceId: schoolConferenceAffiliationsTable.conferenceId,
    })
    .from(schoolConferenceAffiliationsTable)
    .where(eq(schoolConferenceAffiliationsTable.schoolId, id));

describe("replaceSchoolConferenceAffiliations", () => {
  it("replaces a school's rows with Sanity's and leaves other schools alone", async () => {
    await db.insert(schoolConferenceAffiliationsTable).values([
      { schoolId, sportId: sport.football, conferenceId: conference.mvfc },
      {
        schoolId: otherSchoolId,
        sportId: sport.football,
        conferenceId: conference.mvfc,
      },
    ]);

    const result = await replaceSchoolConferenceAffiliations(schoolId, [
      { conferenceId: "sanity-big-sky", sportId: sport.football },
      { conferenceId: "sanity-big-sky", sportId: sport.basketball },
    ]);

    expect(result).toEqual({ replaced: 2, skipped: [] });
    expect(await affiliationsOf(schoolId)).toEqual(
      expect.arrayContaining([
        { sportId: sport.football, conferenceId: conference.bigSky },
        { sportId: sport.basketball, conferenceId: conference.bigSky },
      ]),
    );
    expect(await affiliationsOf(otherSchoolId)).toEqual([
      { sportId: sport.football, conferenceId: conference.mvfc },
    ]);
  });

  it("skips conferences and sports Postgres doesn't have, and drops duplicates", async () => {
    const result = await replaceSchoolConferenceAffiliations(schoolId, [
      { conferenceId: "sanity-big-sky", sportId: sport.football },
      { conferenceId: "sanity-big-sky", sportId: sport.football },
      { conferenceId: "sanity-not-loaded", sportId: sport.football },
      { conferenceId: "sanity-big-sky", sportId: "no-such-sport" },
      { conferenceId: null, sportId: sport.basketball },
    ]);

    expect(result.replaced).toBe(1);
    expect(result.skipped).toEqual([
      { conferenceId: "sanity-not-loaded", sportId: sport.football },
      { conferenceId: "sanity-big-sky", sportId: "no-such-sport" },
    ]);
    expect(await affiliationsOf(schoolId)).toEqual([
      { sportId: sport.football, conferenceId: conference.bigSky },
    ]);
  });

  it("clears a school's rows when Sanity has none", async () => {
    await db.insert(schoolConferenceAffiliationsTable).values({
      schoolId,
      sportId: sport.football,
      conferenceId: conference.mvfc,
    });

    await expect(
      replaceSchoolConferenceAffiliations(schoolId, []),
    ).resolves.toEqual({ replaced: 0, skipped: [] });
    expect(await affiliationsOf(schoolId)).toEqual([]);
  });
});
