import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  dismissDuplicate,
  listDuplicateCandidates,
  mergePlayers,
  previewMerge,
} from "../src/queries/player-duplicates";
import { PortalWriteError } from "../src/queries/players";
import {
  createPortalPlayer,
  getPortalPlayer,
  type PortalEntryInput,
} from "../src/queries/portal-admin";
import { pushPortal } from "../src/queries/portal-publish";
import { recordRecruitmentEvent } from "../src/queries/recruitments";
import {
  playerSportsTable,
  playersTable,
  publishedPlayersTable,
  publishedWireEventsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

let football: string;
let basketball: string;
const school = { montana: "", idaho: "", boise: "" };

const entry = (
  overrides: Partial<PortalEntryInput> = {},
): PortalEntryInput => ({
  sportId: football,
  cycleYear: 2026,
  origin: { schoolId: school.montana },
  enteredAt: day(2),
  ...overrides,
});

const player = (
  firstName: string,
  lastName: string,
  extra: Partial<Parameters<typeof createPortalPlayer>[0]> = {},
) => createPortalPlayer({ firstName, lastName, ...extra });

async function playerRow(id: number) {
  const [row] = await db
    .select({
      mergedIntoId: playersTable.mergedIntoId,
      pendingSince: playersTable.pendingSince,
      hometownCity: playersTable.hometownCity,
      hsGradYear: playersTable.hsGradYear,
    })
    .from(playersTable)
    .where(eq(playersTable.id, id));
  return row;
}

beforeEach(async () => {
  await resetDatabase();
  football = randomUUID();
  basketball = randomUUID();
  await db.insert(sportsTable).values([
    { id: football, slug: "football", name: "Football" },
    { id: basketball, slug: "mens-basketball", name: "Men's Basketball" },
  ]);
  const rows = await db
    .insert(schoolsTable)
    .values([
      { name: "Montana", sanityId: "s-montana" },
      { name: "Idaho", sanityId: "s-idaho" },
      { name: "Boise State", sanityId: "s-boise" },
    ])
    .returning({ id: schoolsTable.id });
  school.montana = rows[0]!.id;
  school.idaho = rows[1]!.id;
  school.boise = rows[2]!.id;
});

describe("listDuplicateCandidates", () => {
  it("pairs similar names that share a sport and a school", async () => {
    const a = await player("Jalen", "Brooks", { entry: entry() });
    const b = await player("Jaylen", "Brooks", { entry: entry() });
    expect(await listDuplicateCandidates()).toEqual([
      {
        playerAId: a.id,
        playerBId: b.id,
        score: expect.any(Number),
        sameSchool: true,
        sameHometown: false,
        sameClass: false,
      },
    ]);
  });

  it("counts a destination, hometown, or high school class as a signal", async () => {
    const a = await player("Jalen", "Brooks", { entry: entry() });
    const b = await player("Jalen", "Brooks", {
      entry: entry({ origin: { schoolId: school.idaho } }),
    });
    expect(await listDuplicateCandidates()).toEqual([]);

    const [recruitment] = (await getPortalPlayer(a.id))!.sports[0]!
      .recruitments;
    await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: school.idaho },
    });
    expect((await listDuplicateCandidates())[0]).toMatchObject({
      playerAId: a.id,
      playerBId: b.id,
      sameSchool: true,
    });

    const c = await player("Marcus", "Hill", {
      hometownCity: "Boise",
      hometownState: "ID",
      hsGradYear: 2023,
      entry: entry({ origin: { schoolName: "Carroll College" } }),
    });
    const d = await player("Markus", "Hill", {
      hometownCity: "boise",
      hometownState: "id",
      hsGradYear: 2023,
      entry: entry({ origin: { schoolName: "Rocky Mountain" } }),
    });
    expect(
      (await listDuplicateCandidates()).find((pair) => pair.playerAId === c.id),
    ).toMatchObject({
      playerBId: d.id,
      sameSchool: false,
      sameHometown: true,
      sameClass: true,
    });
  });

  it("matches free-text schools by name, ignoring case", async () => {
    await player("Jalen", "Brooks", {
      entry: entry({ origin: { schoolName: "Carroll College" } }),
    });
    await player("Jalen", "Brooks", {
      entry: entry({ origin: { schoolName: "carroll college" } }),
    });
    expect(await listDuplicateCandidates()).toHaveLength(1);
  });

  it("skips different sports, different names, dismissed pairs, and merged players", async () => {
    const a = await player("Jalen", "Brooks", { entry: entry() });
    await player("Jalen", "Brooks", {
      entry: entry({ sportId: basketball }),
    });
    await player("Trevor", "Nakamura", { entry: entry() });
    expect(await listDuplicateCandidates()).toEqual([]);

    const b = await player("Jalen", "Brookes", { entry: entry() });
    expect(await listDuplicateCandidates()).toHaveLength(1);
    await dismissDuplicate({ playerIds: [b.id, a.id] });
    await dismissDuplicate({ playerIds: [a.id, b.id] });
    expect(await listDuplicateCandidates()).toEqual([]);

    const c = await player("Jalen", "Brooks", { entry: entry() });
    expect(await listDuplicateCandidates()).not.toEqual([]);
    await mergePlayers({ survivorId: a.id, loserId: c.id });
    await mergePlayers({ survivorId: a.id, loserId: b.id });
    expect(await listDuplicateCandidates()).toEqual([]);
  });

  it("needs a closer name when only the high school class matches", async () => {
    await player("Marcus", "Hill", {
      hsGradYear: 2023,
      entry: entry({ origin: { schoolName: "Carroll College" } }),
    });
    await player("Marcus", "Hills", {
      hsGradYear: 2023,
      entry: entry({ origin: { schoolName: "Rocky Mountain" } }),
    });
    await player("Marc", "Hilton", {
      hsGradYear: 2023,
      entry: entry({ origin: { schoolName: "Montana Tech" } }),
    });
    const pairs = await listDuplicateCandidates();
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.score).toBeGreaterThanOrEqual(0.6);
  });

  it("only checks pairs where one player was added recently", async () => {
    const a = await player("Jalen", "Brooks", { entry: entry() });
    const b = await player("Jalen", "Brooks", { entry: entry() });
    await db
      .update(playersTable)
      .set({ createdAt: new Date(Date.now() - 200 * 86_400_000) })
      .where(eq(playersTable.id, a.id));
    expect(await listDuplicateCandidates()).toHaveLength(1);
    await db
      .update(playersTable)
      .set({ createdAt: new Date(Date.now() - 200 * 86_400_000) })
      .where(eq(playersTable.id, b.id));
    expect(await listDuplicateCandidates()).toEqual([]);
    expect(await listDuplicateCandidates({ recentDays: 365 })).toHaveLength(1);
  });

  it("refuses to dismiss a player against themselves", async () => {
    await expect(
      dismissDuplicate({ playerIds: [1, 1] }),
    ).rejects.toBeInstanceOf(PortalWriteError);
  });
});

describe("mergePlayers", () => {
  it("previews which sports move and which stay", async () => {
    const survivor = await player("Jalen", "Brooks", { entry: entry() });
    const loser = await player("Jalen", "Brooks", { entry: entry() });
    await createPortalPlayer({ firstName: "x", lastName: "y" });
    const [recruitment] = (await getPortalPlayer(loser.id))!.sports[0]!
      .recruitments;
    await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "offered",
      occurredAt: day(3),
      school: { schoolId: school.boise },
    });
    // A basketball entry from a closed football one isn't possible on one
    // player-sport, so give the loser a second sport directly.
    await db
      .insert(playerSportsTable)
      .values({ playerId: loser.id, sportId: basketball });

    expect(await previewMerge(survivor.id, loser.id)).toEqual([
      {
        sportId: football,
        sportName: "Football",
        action: "keep",
        recruitments: 1,
        events: 2,
      },
      {
        sportId: basketball,
        sportName: "Men's Basketball",
        action: "move",
        recruitments: 0,
        events: 0,
      },
    ]);
  });

  it("moves a sport the survivor doesn't have, with its whole history", async () => {
    const survivor = await player("Jalen", "Brooks", { entry: entry() });
    const loser = await player("Jalen", "Brooks", {
      entry: entry({
        sportId: basketball,
        origin: { schoolId: school.idaho },
      }),
    });
    await pushPortal({ trigger: "admin" });

    await mergePlayers({ survivorId: survivor.id, loserId: loser.id });
    const merged = await getPortalPlayer(survivor.id);
    expect(merged!.sports.map((sport) => sport.sportSlug).sort()).toEqual([
      "football",
      "mens-basketball",
    ]);
    const hoops = merged!.sports.find((s) => s.sportSlug === "mens-basketball");
    expect(hoops!.recruitments[0]).toMatchObject({ originName: "Idaho" });
    expect(await getPortalPlayer(loser.id)).toMatchObject({
      mergedIntoId: survivor.id,
      sports: [],
    });
    expect((await playerRow(survivor.id))!.pendingSince).not.toBeNull();
    expect((await playerRow(loser.id))!.pendingSince).not.toBeNull();

    // After a push the loser's URL redirects and its wire rows belong to the survivor.
    await pushPortal({ trigger: "admin" });
    const [redirect] = await db
      .select({
        redirect: publishedPlayersTable.redirectToPlayerId,
        doc: publishedPlayersTable.doc,
      })
      .from(publishedPlayersTable)
      .where(eq(publishedPlayersTable.playerId, loser.id));
    expect(redirect).toEqual({
      redirect: survivor.id,
      doc: { v: 1, redirectToPlayerId: survivor.id },
    });
    const wire = await db
      .select({ playerId: publishedWireEventsTable.playerId })
      .from(publishedWireEventsTable);
    expect(new Set(wire.map((row) => row.playerId))).toEqual(
      new Set([survivor.id]),
    );
    expect(wire).toHaveLength(2);
  });

  it("keeps the survivor's history in a shared sport and fills blanks", async () => {
    const survivor = await player("Jalen", "Brooks", {
      entry: entry({ attributes: { position: "QB" } }),
    });
    const loser = await player("Jalen", "Brooks", {
      hometownCity: "Missoula",
      hsGradYear: 2023,
      entry: entry({
        origin: { schoolId: school.montana },
        attributes: { position: "WR", heightIn: 74 },
      }),
    });

    const { plan } = await mergePlayers({
      survivorId: survivor.id,
      loserId: loser.id,
    });
    expect(plan.map((sport) => sport.action)).toEqual(["keep"]);
    const merged = await getPortalPlayer(survivor.id);
    expect(merged).toMatchObject({
      hometownCity: "Missoula",
      hsGradYear: 2023,
    });
    expect(merged!.sports).toHaveLength(1);
    expect(merged!.sports[0]).toMatchObject({ position: "QB", heightIn: 74 });
    expect(merged!.sports[0]!.recruitments).toHaveLength(1);
    // The loser's own entry stays on the tombstone and isn't published.
    expect((await getPortalPlayer(loser.id))!.sports).toHaveLength(1);
    await pushPortal({ trigger: "admin" });
    const wire = await db
      .select({ playerId: publishedWireEventsTable.playerId })
      .from(publishedWireEventsTable);
    expect(wire.map((row) => row.playerId)).toEqual([survivor.id]);
  });

  it("points earlier merges at the new survivor", async () => {
    const a = await player("Jalen", "Brooks");
    const b = await player("Jalen", "Brooks");
    const c = await player("Jalen", "Brooks");
    await mergePlayers({ survivorId: b.id, loserId: c.id });
    await pushPortal({ trigger: "admin" });

    const { repointed } = await mergePlayers({
      survivorId: a.id,
      loserId: b.id,
    });
    expect(repointed).toEqual([c.id]);
    expect(await playerRow(c.id)).toMatchObject({
      mergedIntoId: a.id,
      pendingSince: expect.any(Date),
    });
  });

  it("refuses the same player, a merged player, or an unknown one", async () => {
    const a = await player("Jalen", "Brooks");
    const b = await player("Jalen", "Brooks");
    await expect(
      mergePlayers({ survivorId: a.id, loserId: a.id }),
    ).rejects.toMatchObject({ code: "merge_same_player" });
    await mergePlayers({ survivorId: a.id, loserId: b.id });
    await expect(
      mergePlayers({ survivorId: b.id, loserId: a.id }),
    ).rejects.toMatchObject({ code: "player_merged" });
    await expect(
      mergePlayers({ survivorId: a.id, loserId: 1 }),
    ).rejects.toMatchObject({ code: "player_not_found" });
  });
});
