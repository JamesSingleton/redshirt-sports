import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  mergePlayers,
  previewMergeIdConflicts,
} from "../src/queries/player-duplicates";
import {
  addPlayerExternalId,
  listPlayerExternalIds,
  removePlayerExternalId,
} from "../src/queries/player-external-ids";
import { createPortalPlayer } from "../src/queries/portal-admin";
import { pushPortal } from "../src/queries/portal-publish";
import {
  playerAuditLogTable,
  playerExternalIdsTable,
  publishedPlayersTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const player = (firstName = "Jalen", lastName = "Brooks") =>
  createPortalPlayer({ firstName, lastName });

const ids = async (playerId: number) =>
  (await listPlayerExternalIds(playerId)).map(
    (row) => `${row.provider}:${row.externalId}`,
  );

beforeEach(async () => {
  await resetDatabase();
});

describe("player external ids", () => {
  it("adds and removes ids, with audit rows", async () => {
    const p = await player();
    const espn = await addPlayerExternalId({
      playerId: p.id,
      provider: "espn",
      externalId: "4432577",
    });
    await addPlayerExternalId({
      playerId: p.id,
      provider: "ncaa",
      externalId: "7612345",
    });
    expect(await ids(p.id)).toEqual(["espn:4432577", "ncaa:7612345"]);

    await removePlayerExternalId({ playerId: p.id, id: espn.id });
    expect(await ids(p.id)).toEqual(["ncaa:7612345"]);

    const audit = await db
      .select({ action: playerAuditLogTable.action })
      .from(playerAuditLogTable)
      .where(eq(playerAuditLogTable.entity, "player_external_ids"));
    expect(audit.map((row) => row.action).sort()).toEqual([
      "add",
      "add",
      "remove",
    ]);
  });

  it("refuses an id another player has, naming them", async () => {
    const a = await player();
    const b = await player("Jaylen", "Brooks");
    await addPlayerExternalId({
      playerId: a.id,
      provider: "espn",
      externalId: "4432577",
    });
    await expect(
      addPlayerExternalId({
        playerId: b.id,
        provider: "espn",
        externalId: "4432577",
      }),
    ).rejects.toMatchObject({
      code: "external_id_taken",
      message: expect.stringContaining(`Jalen Brooks (#${a.id})`),
    });
    await expect(
      addPlayerExternalId({
        playerId: a.id,
        provider: "espn",
        externalId: "4432577",
      }),
    ).rejects.toMatchObject({
      code: "external_id_taken",
      message: expect.stringContaining("already has that ESPN id"),
    });
    // The same number from another provider is a different id.
    await addPlayerExternalId({
      playerId: b.id,
      provider: "ncaa",
      externalId: "4432577",
    });
  });

  it("allows one id per provider per player", async () => {
    const p = await player();
    await addPlayerExternalId({
      playerId: p.id,
      provider: "espn",
      externalId: "1",
    });
    await expect(
      addPlayerExternalId({
        playerId: p.id,
        provider: "espn",
        externalId: "2",
      }),
    ).rejects.toMatchObject({ code: "external_id_exists" });
  });

  it("refuses an unknown player or id", async () => {
    const p = await player();
    await expect(
      addPlayerExternalId({ playerId: 1, provider: "espn", externalId: "1" }),
    ).rejects.toMatchObject({ code: "player_not_found" });
    await expect(
      removePlayerExternalId({ playerId: p.id, id: 999 }),
    ).rejects.toMatchObject({ code: "external_id_not_found" });
  });

  it("is checked by the database too", async () => {
    const p = await player();
    await expect(
      db.insert(playerExternalIdsTable).values({
        playerId: p.id,
        provider: "ncaa_eligibility",
        externalId: "2601808637",
      }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(playerExternalIdsTable)
        .values({ playerId: p.id, provider: "espn", externalId: "abc" }),
    ).rejects.toThrow();
  });

  it("is never published", async () => {
    const p = await player();
    await addPlayerExternalId({
      playerId: p.id,
      provider: "espn",
      externalId: "4432577",
    });
    await pushPortal({ trigger: "admin" });
    const rows = await db.select().from(publishedPlayersTable);
    expect(JSON.stringify(rows)).not.toContain("4432577");
  });
});

describe("merging players with ids", () => {
  it("moves the loser's ids to the survivor", async () => {
    const a = await player();
    const b = await player();
    await addPlayerExternalId({
      playerId: a.id,
      provider: "espn",
      externalId: "4432577",
    });
    await addPlayerExternalId({
      playerId: b.id,
      provider: "ncaa",
      externalId: "7612345",
    });
    expect(await previewMergeIdConflicts(a.id, b.id)).toEqual([]);
    await mergePlayers({ survivorId: a.id, loserId: b.id });
    expect(await ids(a.id)).toEqual(["espn:4432577", "ncaa:7612345"]);
    expect(await ids(b.id)).toEqual([]);
  });

  it("refuses when both have a different id from one provider", async () => {
    const a = await player();
    const b = await player();
    await addPlayerExternalId({
      playerId: a.id,
      provider: "espn",
      externalId: "1",
    });
    await addPlayerExternalId({
      playerId: b.id,
      provider: "espn",
      externalId: "2",
    });
    await addPlayerExternalId({
      playerId: b.id,
      provider: "ncaa",
      externalId: "3",
    });
    expect(await previewMergeIdConflicts(a.id, b.id)).toEqual([
      { provider: "espn", survivorExternalId: "1", loserExternalId: "2" },
    ]);
    await expect(
      mergePlayers({ survivorId: a.id, loserId: b.id }),
    ).rejects.toMatchObject({
      code: "merge_id_conflict",
      message: expect.stringContaining("different ESPN ids"),
    });
    // Nothing moved.
    expect(await ids(b.id)).toEqual(["espn:2", "ncaa:3"]);
  });
});
