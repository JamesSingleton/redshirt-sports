import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { isValidPosition, POSITIONS_BY_SPORT } from "../portal/constants";
import { normalizePlayerName, playerSlug } from "../portal/player-url";
import {
  playerAuditLogTable,
  playerEnrollmentsTable,
  playerSportsTable,
  playersTable,
  schoolsTable,
  sportsTable,
} from "../schema";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | DbTransaction;

/** A rule the admin can fix (wrong order of events, duplicate entry), as opposed to a bug. */
export class PortalWriteError extends Error {
  constructor(
    readonly code:
      | "player_not_found"
      | "player_merged"
      | "invalid_position"
      | "recruitment_not_found"
      | "recruitment_open"
      | "current_school_mismatch"
      | "invalid_transition"
      | "event_not_found"
      | "event_already_voided"
      | "later_recruitment_exists",
    message: string,
  ) {
    super(message);
    this.name = "PortalWriteError";
  }
}

/**
 * Serialize every write for one player. Transaction-scoped advisory lock:
 * released on commit/rollback, and safe through the Supavisor transaction pooler.
 */
export async function lockPlayer(tx: DbTransaction, playerId: number) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`player:${playerId}`}, 0))`,
  );
}

/** Flag the player as having unpublished changes. Keeps the oldest timestamp. */
export async function markPlayerPending(tx: DbTransaction, playerId: number) {
  await tx
    .update(playersTable)
    .set({ pendingSince: sql`coalesce(${playersTable.pendingSince}, now())` })
    .where(eq(playersTable.id, playerId));
}

export interface AuditEntry {
  playerId: number;
  entity: string;
  entityId: number;
  action: string;
  before?: unknown;
  after?: unknown;
  actorUserId?: string | null;
}

export async function writePlayerAudit(tx: DbTransaction, entry: AuditEntry) {
  await tx.insert(playerAuditLogTable).values({
    playerId: entry.playerId,
    entity: entry.entity,
    entityId: entry.entityId,
    action: entry.action,
    before: entry.before ?? null,
    after: entry.after ?? null,
    actorUserId: entry.actorUserId ?? null,
  });
}

export interface CreatePlayerInput {
  firstName: string;
  lastName: string;
  suffix?: string | null;
  hometownCity?: string | null;
  hometownState?: string | null;
  highSchoolName?: string | null;
  hsGradYear?: number | null;
  actorUserId?: string | null;
}

export async function createPlayer(
  tx: DbTransaction,
  input: CreatePlayerInput,
) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const suffix = input.suffix?.trim() || null;
  const [player] = await tx
    .insert(playersTable)
    .values({
      firstName,
      lastName,
      suffix,
      slug: playerSlug(firstName, lastName, suffix),
      nameSearch: normalizePlayerName(firstName, lastName, suffix),
      hometownCity: input.hometownCity?.trim() || null,
      hometownState: input.hometownState?.trim() || null,
      highSchoolName: input.highSchoolName?.trim() || null,
      hsGradYear: input.hsGradYear ?? null,
      pendingSince: sql`now()`,
    })
    .returning({
      id: playersTable.id,
      slug: playersTable.slug,
      nameSearch: playersTable.nameSearch,
      pendingSince: playersTable.pendingSince,
    });
  if (!player) throw new Error("Player insert returned no row.");
  await writePlayerAudit(tx, {
    playerId: player.id,
    entity: "players",
    entityId: player.id,
    action: "create",
    after: { firstName, lastName, suffix },
    actorUserId: input.actorUserId,
  });
  return player;
}

/** Refuses ids that don't exist or were merged away. */
export async function requireActivePlayer(tx: DbTransaction, playerId: number) {
  const [player] = await tx
    .select({ id: playersTable.id, mergedIntoId: playersTable.mergedIntoId })
    .from(playersTable)
    .where(eq(playersTable.id, playerId));
  if (!player) {
    throw new PortalWriteError("player_not_found", "Player not found.");
  }
  if (player.mergedIntoId !== null) {
    throw new PortalWriteError(
      "player_merged",
      `Player was merged into ${player.mergedIntoId}.`,
    );
  }
  return player;
}

export interface PlayerSportAttributes {
  position?: string | null;
  heightIn?: number | null;
  weightLb?: number | null;
}

/** Get or create the player's row for a sport, updating any attributes passed. */
export async function ensurePlayerSport(
  tx: DbTransaction,
  playerId: number,
  sportId: string,
  attributes: PlayerSportAttributes = {},
) {
  if (attributes.position) {
    const [sport] = await tx
      .select({ slug: sportsTable.slug })
      .from(sportsTable)
      .where(eq(sportsTable.id, sportId));
    const slug = sport?.slug ?? "";
    if (
      POSITIONS_BY_SPORT[slug] &&
      !isValidPosition(slug, attributes.position)
    ) {
      throw new PortalWriteError(
        "invalid_position",
        `${attributes.position} is not a ${slug} position.`,
      );
    }
  }
  const provided = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  ) as PlayerSportAttributes;
  const [row] = await tx
    .insert(playerSportsTable)
    .values({ playerId, sportId, ...provided })
    .onConflictDoUpdate({
      target: [playerSportsTable.playerId, playerSportsTable.sportId],
      // Always touch a column so the row comes back even when nothing changed.
      set: { ...provided, updatedAt: sql`now()` },
    })
    .returning({ id: playerSportsTable.id });
  if (!row) throw new Error("Player sport upsert returned no row.");
  return row;
}

export interface SimilarPlayer {
  id: number;
  firstName: string;
  lastName: string;
  suffix: string | null;
  slug: string;
  hometownCity: string | null;
  hometownState: string | null;
  hsGradYear: number | null;
  similarity: number;
  /** Current school per sport, e.g. "Montana (football)". */
  currentSchools: string[];
}

/**
 * Existing players whose names look like `name`, best match first. Shown while
 * an admin types a new player so a duplicate is caught before it is created.
 * Uses the trigram index on `players.name_search`.
 */
export async function findSimilarPlayers(
  name: string,
  { limit = 8, executor = db }: { limit?: number; executor?: DbExecutor } = {},
): Promise<SimilarPlayer[]> {
  const needle = normalizePlayerName(name);
  if (needle.length < 3) return [];

  const similarity = sql<number>`extensions.similarity(${playersTable.nameSearch}, ${needle})`;
  const matches = await executor
    .select({
      id: playersTable.id,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      suffix: playersTable.suffix,
      slug: playersTable.slug,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      hsGradYear: playersTable.hsGradYear,
      similarity,
    })
    .from(playersTable)
    .where(
      and(
        sql`${playersTable.nameSearch} operator(extensions.%) ${needle}`,
        isNull(playersTable.mergedIntoId),
      ),
    )
    .orderBy(desc(similarity), playersTable.id)
    .limit(limit);
  if (matches.length === 0) return [];

  const schools = await executor
    .select({
      playerId: playerSportsTable.playerId,
      sportSlug: sportsTable.slug,
      schoolName: sql<string>`coalesce(${schoolsTable.name}, ${playerEnrollmentsTable.schoolName})`,
    })
    .from(playerEnrollmentsTable)
    .innerJoin(
      playerSportsTable,
      eq(playerSportsTable.id, playerEnrollmentsTable.playerSportId),
    )
    .innerJoin(sportsTable, eq(sportsTable.id, playerSportsTable.sportId))
    .leftJoin(
      schoolsTable,
      eq(schoolsTable.id, playerEnrollmentsTable.schoolId),
    )
    .where(
      and(
        inArray(
          playerSportsTable.playerId,
          matches.map((match) => match.id),
        ),
        isNull(playerEnrollmentsTable.endYear),
      ),
    );

  return matches.map((match) => ({
    ...match,
    similarity: Number(match.similarity),
    currentSchools: schools
      .filter((school) => school.playerId === match.id)
      .map((school) => `${school.schoolName} (${school.sportSlug})`),
  }));
}
