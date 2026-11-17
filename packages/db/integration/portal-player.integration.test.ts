import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mergePlayers } from "../src/queries/player-duplicates";
import { createPortalPlayer } from "../src/queries/portal-admin";
import {
  getPublishedPlayer,
  getPublishedPlayerAddress,
  listIndexablePlayers,
} from "../src/queries/portal-player";
import { pushPortal } from "../src/queries/portal-publish";
import { recordRecruitmentEvent } from "../src/queries/recruitments";
import {
  conferenceSportSubdivisionsTable,
  conferencesTable,
  divisionsTable,
  publishedPlayersTable,
  publishedWireEventsTable,
  recruitmentsTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));
const ids = {
  football: "",
  d1: "",
  fcs: "",
  bigSky: "",
  montana: "",
  idaho: "",
};

beforeEach(async () => {
  await resetDatabase();
  ids.football = randomUUID();
  await db
    .insert(sportsTable)
    .values({ id: ids.football, slug: "football", name: "Football" });
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
          preview: "data:image/png;base64,AAAA",
          asset: { _ref: "image-abc-200x200-svg", _type: "reference" },
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

async function enter(lastName: string, commit = false) {
  const player = await createPortalPlayer({
    firstName: "Test",
    lastName,
    entry: {
      sportId: ids.football,
      cycleYear: 2026,
      origin: { schoolId: ids.montana },
      enteredAt: day(2),
    },
  });
  if (commit) {
    const [recruitment] = await db
      .select({ id: recruitmentsTable.id })
      .from(recruitmentsTable)
      .orderBy(sql`${recruitmentsTable.id} desc`)
      .limit(1);
    await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: ids.idaho },
    });
  }
  return player;
}

describe("getPublishedPlayer", () => {
  it("is null until the player is pushed", async () => {
    const player = await enter("Unpushed");
    expect(await getPublishedPlayer(player.id)).toBeNull();
    expect(await getPublishedPlayer(999_999)).toBeNull();
  });

  it("returns the doc with the schools, levels, and conferences it names", async () => {
    const player = await enter("Brooks", true);
    await pushPortal({ trigger: "admin" });

    const page = await getPublishedPlayer(player.id);
    expect(page?.kind).toBe("player");
    if (page?.kind !== "player") return;
    expect(page.data.indexable).toBe(true);
    expect(page.data.doc).toMatchObject({ id: player.id, lastName: "Brooks" });
    expect(page.data.doc.sports[0]!.recruitments[0]).toMatchObject({
      status: "committed",
      destination: { schoolId: ids.idaho },
    });
    expect(Object.keys(page.data.schools).sort()).toEqual(
      [ids.montana, ids.idaho].sort(),
    );
    // A slim logo, as on the wire.
    expect(page.data.schools[ids.montana]!.image).toEqual({
      asset: { _ref: "image-abc-200x200-svg", _type: "reference" },
    });
    expect(page.data.levels).toEqual({
      [ids.d1]: { name: "NCAA DI", slug: "d1", parentId: null },
      [ids.fcs]: { name: "FCS", slug: "fcs", parentId: ids.d1 },
    });
    expect(page.data.conferences).toEqual({
      [ids.bigSky]: { name: "Big Sky Conference", shortName: "Big Sky" },
    });
    expect(Date.parse(page.data.publishedAt)).not.toBeNaN();
  });

  it("is not indexable before a commitment", async () => {
    const player = await enter("Entered");
    await pushPortal({ trigger: "admin" });
    const page = await getPublishedPlayer(player.id);
    expect(page).toMatchObject({ kind: "player", data: { indexable: false } });
  });

  it("sends a merged player to the survivor", async () => {
    const survivor = await enter("Same", true);
    const loser = await createPortalPlayer({
      firstName: "Test",
      lastName: "Same",
    });
    await pushPortal({ trigger: "admin" });
    await mergePlayers({ survivorId: survivor.id, loserId: loser.id });
    await pushPortal({ trigger: "admin" });
    expect(await getPublishedPlayer(loser.id)).toEqual({
      kind: "redirect",
      id: survivor.id,
      slug: "test-same",
    });
  });

  it("is null for an unreadable doc or a redirect to nowhere", async () => {
    const survivor = await enter("Bad", true);
    const loser = await createPortalPlayer({
      firstName: "Test",
      lastName: "Gone",
    });
    await pushPortal({ trigger: "admin" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await db
      .update(publishedPlayersTable)
      .set({ doc: { v: 99 } })
      .where(eq(publishedPlayersTable.playerId, survivor.id));
    expect(await getPublishedPlayer(survivor.id)).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();

    // Redirect doc unreadable.
    await db
      .update(publishedPlayersTable)
      .set({ redirectToPlayerId: survivor.id, doc: { v: 99 } })
      .where(eq(publishedPlayersTable.playerId, loser.id));
    expect(await getPublishedPlayer(loser.id)).toBeNull();

    // Redirect to a player who is itself a redirect: not followed.
    await db
      .update(publishedPlayersTable)
      .set({ doc: { v: 1, redirectToPlayerId: survivor.id } })
      .where(eq(publishedPlayersTable.playerId, loser.id));
    await db
      .update(publishedPlayersTable)
      .set({ redirectToPlayerId: loser.id })
      .where(eq(publishedPlayersTable.playerId, survivor.id));
    expect(await getPublishedPlayer(loser.id)).toBeNull();
  });
});

describe("listIndexablePlayers", () => {
  it("lists committed, unmerged players newest first", async () => {
    const first = await enter("First", true);
    await enter("Entered");
    await pushPortal({ trigger: "admin" });
    const second = await enter("Second", true);
    await pushPortal({ trigger: "admin" });

    const listed = await listIndexablePlayers();
    expect(listed.map((row) => row.id)).toEqual([second.id, first.id]);
    expect(listed[0]).toMatchObject({ slug: "test-second" });
    expect((await listIndexablePlayers(1)).map((row) => row.id)).toEqual([
      second.id,
    ]);
  });
});

describe("reported interest and story links", () => {
  it("publishes contact and visits on the player page, never on the tracker", async () => {
    const player = await enter("Visitor", true);
    const [recruitment] = await db
      .select({ id: recruitmentsTable.id })
      .from(recruitmentsTable)
      .orderBy(sql`${recruitmentsTable.id} desc`)
      .limit(1);
    const record = (
      type: "contacted" | "visit_scheduled" | "visited" | "offered",
      n: number,
      storySlug?: string,
    ) =>
      recordRecruitmentEvent({
        recruitmentId: recruitment!.id,
        type,
        occurredAt: day(n),
        school: { schoolId: ids.idaho },
        storySlug,
      });
    await record("contacted", 6);
    await record("visit_scheduled", 7);
    await record("visited", 8, "portal-qb-visits-idaho");
    await record("offered", 9, "idaho-offers-portal-qb");
    await pushPortal({ trigger: "admin" });

    const page = await getPublishedPlayer(player.id);
    if (page?.kind !== "player") throw new Error("expected a player page");
    const [entry] = page.data.doc.sports[0]!.recruitments;
    expect(entry!.interest).toMatchObject([
      { type: "contacted", schoolId: ids.idaho },
      { type: "visit_scheduled", schoolId: ids.idaho },
      {
        type: "visited",
        schoolId: ids.idaho,
        storySlug: "portal-qb-visits-idaho",
      },
    ]);
    expect(entry!.interest![0]).not.toHaveProperty("storySlug");
    expect(entry!.offers).toMatchObject([
      { schoolId: ids.idaho, storySlug: "idaho-offers-portal-qb" },
    ]);
    // The timeline holds only the moves that change where they stand.
    expect(entry!.events.map((event) => event.type)).toEqual([
      "entered",
      "committed",
    ]);
    const wire = await db
      .select({ type: publishedWireEventsTable.type })
      .from(publishedWireEventsTable);
    expect(wire.map((row) => row.type).sort()).toEqual([
      "committed",
      "entered",
    ]);
  });

  it("refuses a story link that isn't a slug", async () => {
    await enter("Slug");
    const [recruitment] = await db
      .select({ id: recruitmentsTable.id })
      .from(recruitmentsTable)
      .limit(1);
    await expect(
      recordRecruitmentEvent({
        recruitmentId: recruitment!.id,
        type: "contacted",
        occurredAt: day(6),
        school: { schoolId: ids.idaho },
        storySlug: "https://redshirtsports.com/Some Story",
      }),
    ).rejects.toThrow();
  });
});

describe("getPublishedPlayerAddress", () => {
  it("is the player's own id and slug, or null before a push", async () => {
    const player = await enter("Brooks");
    expect(await getPublishedPlayerAddress(player.id)).toBeNull();
    await pushPortal({ trigger: "admin" });
    expect(await getPublishedPlayerAddress(player.id)).toEqual({
      id: player.id,
      slug: "test-brooks",
    });
    expect(await getPublishedPlayerAddress(999_999)).toBeNull();
  });

  it("is the survivor's for a merged player, and null when the survivor is gone", async () => {
    const survivor = await enter("Same", true);
    const loser = await createPortalPlayer({
      firstName: "Test",
      lastName: "Same",
    });
    await pushPortal({ trigger: "admin" });
    await mergePlayers({ survivorId: survivor.id, loserId: loser.id });
    await pushPortal({ trigger: "admin" });
    expect(await getPublishedPlayerAddress(loser.id)).toEqual({
      id: survivor.id,
      slug: "test-same",
    });
    // The survivor is itself a redirect: not followed.
    await db
      .update(publishedPlayersTable)
      .set({ redirectToPlayerId: loser.id })
      .where(eq(publishedPlayersTable.playerId, survivor.id));
    expect(await getPublishedPlayerAddress(loser.id)).toBeNull();
  });
});
