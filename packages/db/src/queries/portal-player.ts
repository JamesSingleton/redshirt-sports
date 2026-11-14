import { and, desc, eq, isNull } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { type PortalPlayerPage, playerReferences } from "../portal/player";
import {
  publishedPlayerDocSchema,
  publishedRedirectDocSchema,
} from "../portal/published";
import { publishedPlayersTable } from "../schema";
import {
  conferenceDictionary,
  levelDictionary,
  levelsById,
  schoolDictionary,
} from "./portal-wire";

// Public reads of published player pages. Only the push writes this table.

const pageColumns = {
  slug: publishedPlayersTable.slug,
  indexable: publishedPlayersTable.indexable,
  redirectToPlayerId: publishedPlayersTable.redirectToPlayerId,
  doc: publishedPlayersTable.doc,
  publishedAt: publishedPlayersTable.publishedAt,
};

/**
 * One player's page by id (the primary key), with the schools, levels, and
 * conferences it names. A merged player resolves to the survivor's id and
 * slug. Null for an unpublished id or a doc the site can't read.
 */
export async function getPublishedPlayer(
  playerId: number,
): Promise<PortalPlayerPage | null> {
  const [row] = await db
    .select(pageColumns)
    .from(publishedPlayersTable)
    .where(eq(publishedPlayersTable.playerId, playerId));
  if (!row) return null;

  if (row.redirectToPlayerId !== null) {
    if (!publishedRedirectDocSchema.safeParse(row.doc).success) return null;
    // Merges re-point earlier merges at the survivor, so this is one hop.
    const [target] = await db
      .select({ slug: publishedPlayersTable.slug })
      .from(publishedPlayersTable)
      .where(
        and(
          eq(publishedPlayersTable.playerId, row.redirectToPlayerId),
          isNull(publishedPlayersTable.redirectToPlayerId),
        ),
      );
    return target
      ? { kind: "redirect", id: row.redirectToPlayerId, slug: target.slug }
      : null;
  }

  const parsed = publishedPlayerDocSchema.safeParse(row.doc);
  if (!parsed.success) {
    console.error("Unreadable published player doc", playerId, parsed.error);
    return null;
  }
  const refs = playerReferences(parsed.data);
  const levelIds = [...refs.levels];
  const [schools, levels, conferences] = await Promise.all([
    schoolDictionary([...refs.schools]),
    levelIds.length === 0 ? [] : levelsById(levelIds),
    conferenceDictionary([...refs.conferences]),
  ]);
  return {
    kind: "player",
    data: {
      doc: parsed.data,
      indexable: row.indexable,
      publishedAt: row.publishedAt.toISOString(),
      schools,
      levels: levelDictionary(levels),
      conferences,
    },
  };
}

/**
 * Players search engines may list, newest first: committed somewhere and not
 * merged away. Ids and slugs only, for the sitemap and static params.
 */
export async function listIndexablePlayers(limit?: number) {
  const query = db
    .select({
      id: publishedPlayersTable.playerId,
      slug: publishedPlayersTable.slug,
      publishedAt: publishedPlayersTable.publishedAt,
    })
    .from(publishedPlayersTable)
    .where(
      and(
        eq(publishedPlayersTable.indexable, true),
        isNull(publishedPlayersTable.redirectToPlayerId),
      ),
    )
    .orderBy(
      desc(publishedPlayersTable.publishedAt),
      desc(publishedPlayersTable.playerId),
    );
  return limit === undefined ? query : query.limit(limit);
}
