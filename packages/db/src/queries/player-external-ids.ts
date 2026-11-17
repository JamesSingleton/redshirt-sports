import { and, asc, eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  PLAYER_ID_PROVIDER_LABELS,
  type PlayerIdProvider,
} from "../portal/constants";
import { playerExternalIdsTable, playersTable } from "../schema";
import { lockPlayer, PortalWriteError, writePlayerAudit } from "./players";

// Public ids a player has elsewhere (ESPN, stats.ncaa.org). Internal only:
// they help match players and are never published.

const idColumns = {
  id: playerExternalIdsTable.id,
  provider: playerExternalIdsTable.provider,
  externalId: playerExternalIdsTable.externalId,
};

export function listPlayerExternalIds(playerId: number) {
  return db
    .select(idColumns)
    .from(playerExternalIdsTable)
    .where(eq(playerExternalIdsTable.playerId, playerId))
    .orderBy(asc(playerExternalIdsTable.provider));
}

export type PlayerExternalId = Awaited<
  ReturnType<typeof listPlayerExternalIds>
>[number];

/**
 * Add a provider's id to a player. Refused when the player already has one
 * from that provider, or when another player has this id: that's almost
 * always the same person entered twice, so the error names them.
 */
export async function addPlayerExternalId(input: {
  playerId: number;
  provider: PlayerIdProvider;
  externalId: string;
  actorUserId?: string | null;
}) {
  const label = PLAYER_ID_PROVIDER_LABELS[input.provider];
  return db.transaction(async (tx) => {
    await lockPlayer(tx, input.playerId);
    const [player] = await tx
      .select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, input.playerId));
    if (!player) {
      throw new PortalWriteError("player_not_found", "Player not found.");
    }
    const [owner] = await tx
      .select({
        playerId: playerExternalIdsTable.playerId,
        firstName: playersTable.firstName,
        lastName: playersTable.lastName,
      })
      .from(playerExternalIdsTable)
      .innerJoin(
        playersTable,
        eq(playersTable.id, playerExternalIdsTable.playerId),
      )
      .where(
        and(
          eq(playerExternalIdsTable.provider, input.provider),
          eq(playerExternalIdsTable.externalId, input.externalId),
        ),
      );
    if (owner) {
      throw new PortalWriteError(
        "external_id_taken",
        owner.playerId === input.playerId
          ? `This player already has that ${label} id.`
          : `${owner.firstName} ${owner.lastName} (#${owner.playerId}) already has that ${label} id. If they're the same person, merge them.`,
      );
    }
    const [existing] = await tx
      .select({ externalId: playerExternalIdsTable.externalId })
      .from(playerExternalIdsTable)
      .where(
        and(
          eq(playerExternalIdsTable.playerId, input.playerId),
          eq(playerExternalIdsTable.provider, input.provider),
        ),
      );
    if (existing) {
      throw new PortalWriteError(
        "external_id_exists",
        `This player already has ${label} id ${existing.externalId}. Remove it first to change it.`,
      );
    }
    const [row] = await tx
      .insert(playerExternalIdsTable)
      .values({
        playerId: input.playerId,
        provider: input.provider,
        externalId: input.externalId,
        createdByUserId: input.actorUserId ?? null,
      })
      .returning(idColumns);
    if (!row) throw new Error("External id insert returned no row.");
    await writePlayerAudit(tx, {
      playerId: input.playerId,
      entity: "player_external_ids",
      entityId: row.id,
      action: "add",
      after: { provider: row.provider, externalId: row.externalId },
      actorUserId: input.actorUserId,
    });
    return row;
  });
}

/** Remove one of a player's ids. */
export async function removePlayerExternalId(input: {
  playerId: number;
  id: number;
  actorUserId?: string | null;
}) {
  return db.transaction(async (tx) => {
    await lockPlayer(tx, input.playerId);
    const [row] = await tx
      .delete(playerExternalIdsTable)
      .where(
        and(
          eq(playerExternalIdsTable.id, input.id),
          eq(playerExternalIdsTable.playerId, input.playerId),
        ),
      )
      .returning(idColumns);
    if (!row) {
      throw new PortalWriteError("external_id_not_found", "That id is gone.");
    }
    await writePlayerAudit(tx, {
      playerId: input.playerId,
      entity: "player_external_ids",
      entityId: row.id,
      action: "remove",
      before: { provider: row.provider, externalId: row.externalId },
      actorUserId: input.actorUserId,
    });
  });
}
