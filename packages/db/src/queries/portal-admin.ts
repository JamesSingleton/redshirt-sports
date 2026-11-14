import { and, asc, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { primaryDb as db } from "../client";
import { PORTAL_SPORT_SLUGS } from "../portal/constants";
import { normalizePlayerName, playerSlug } from "../portal/player-url";
import {
  playerEnrollmentsTable,
  playerSportsTable,
  playersTable,
  recruitmentEventsTable,
  recruitmentsTable,
  schoolsTable,
  sportsTable,
  usersTable,
} from "../schema";
import {
  type CreatePlayerInput,
  createPlayer,
  type DbExecutor,
  ensurePlayerSport,
  lockPlayer,
  markPlayerPending,
  type PlayerSportAttributes,
  requireActivePlayer,
  writePlayerAudit,
} from "./players";
import {
  type OpenRecruitmentInput,
  openRecruitmentLocked,
} from "./recruitments";

// Admin-only reads and writes for the portal desk. Public pages never call
// these; they read the published tables.

const originSchool = alias(schoolsTable, "origin_school");
const destinationSchool = alias(schoolsTable, "destination_school");

/** The sports the tracker covers, as rows. */
export function listPortalSports(executor: DbExecutor = db) {
  return executor
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
    })
    .from(sportsTable)
    .where(inArray(sportsTable.slug, PORTAL_SPORT_SLUGS))
    .orderBy(asc(sportsTable.name));
}

/**
 * The Clerk user id when it has a `users_table` row, else null. Actor columns
 * reference that table, and an admin who never onboarded has no row.
 */
export async function resolvePortalActor(
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null;
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user?.id ?? null;
}

const recruitmentSummaryColumns = {
  id: recruitmentsTable.id,
  playerSportId: recruitmentsTable.playerSportId,
  kind: recruitmentsTable.kind,
  cycleYear: recruitmentsTable.cycleYear,
  status: recruitmentsTable.status,
  statusAt: recruitmentsTable.statusAt,
  enteredAt: recruitmentsTable.enteredAt,
  closedAt: recruitmentsTable.closedAt,
  classAtEntry: recruitmentsTable.classAtEntry,
  eligibilityYears: recruitmentsTable.eligibilityYears,
  isGradTransfer: recruitmentsTable.isGradTransfer,
  originSchoolId: recruitmentsTable.originSchoolId,
  originName: sql<string>`coalesce(${originSchool.name}, ${recruitmentsTable.originSchoolName})`,
  destinationSchoolId: recruitmentsTable.destinationSchoolId,
  destinationName: sql<
    string | null
  >`coalesce(${destinationSchool.name}, ${recruitmentsTable.destinationSchoolName})`,
};

function recruitmentsForPlayerSports(
  playerSportIds: number[],
  executor: DbExecutor,
) {
  return executor
    .select(recruitmentSummaryColumns)
    .from(recruitmentsTable)
    .leftJoin(
      originSchool,
      eq(originSchool.id, recruitmentsTable.originSchoolId),
    )
    .leftJoin(
      destinationSchool,
      eq(destinationSchool.id, recruitmentsTable.destinationSchoolId),
    )
    .where(inArray(recruitmentsTable.playerSportId, playerSportIds))
    .orderBy(desc(recruitmentsTable.enteredAt), desc(recruitmentsTable.id));
}

export type PortalRecruitmentSummary = Awaited<
  ReturnType<typeof recruitmentsForPlayerSports>
>[number];

export interface PortalPlayerListItem {
  id: number;
  firstName: string;
  lastName: string;
  suffix: string | null;
  slug: string;
  hometownCity: string | null;
  hometownState: string | null;
  highSchoolName: string | null;
  hsGradYear: number | null;
  pendingSince: Date | null;
  hiddenAt: Date | null;
  /** Latest recruitment per sport. */
  latest: Array<PortalRecruitmentSummary & { sportSlug: string }>;
}

/**
 * Players newest first, 50 at a time. Keyset on id: pass the last id shown as
 * `beforeId` for the next page. `ids` fetches those players instead.
 */
export async function listPortalPlayers({
  beforeId,
  pendingOnly = false,
  limit = 50,
  ids,
}: {
  beforeId?: number;
  pendingOnly?: boolean;
  limit?: number;
  ids?: number[];
} = {}): Promise<PortalPlayerListItem[]> {
  if (ids && ids.length === 0) return [];
  const players = await db
    .select({
      id: playersTable.id,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      suffix: playersTable.suffix,
      slug: playersTable.slug,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      highSchoolName: playersTable.highSchoolName,
      hsGradYear: playersTable.hsGradYear,
      pendingSince: playersTable.pendingSince,
      hiddenAt: playersTable.hiddenAt,
    })
    .from(playersTable)
    .where(
      and(
        sql`${playersTable.mergedIntoId} is null`,
        ids ? inArray(playersTable.id, ids) : undefined,
        beforeId === undefined ? undefined : lt(playersTable.id, beforeId),
        pendingOnly ? isNotNull(playersTable.pendingSince) : undefined,
      ),
    )
    .orderBy(desc(playersTable.id))
    .limit(limit);
  if (players.length === 0) return [];

  const sports = await db
    .select({
      id: playerSportsTable.id,
      playerId: playerSportsTable.playerId,
      sportSlug: sportsTable.slug,
    })
    .from(playerSportsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, playerSportsTable.sportId))
    .where(
      inArray(
        playerSportsTable.playerId,
        players.map((player) => player.id),
      ),
    );
  const recruitments =
    sports.length === 0
      ? []
      : await recruitmentsForPlayerSports(
          sports.map((sport) => sport.id),
          db,
        );

  return players.map((player) => ({
    ...player,
    latest: sports
      .filter((sport) => sport.playerId === player.id)
      .flatMap((sport) => {
        // Already newest first.
        const latest = recruitments.find(
          (recruitment) => recruitment.playerSportId === sport.id,
        );
        return latest ? [{ ...latest, sportSlug: sport.sportSlug }] : [];
      }),
  }));
}

/** Everything the admin player page shows, sources and voided events included. */
export async function getPortalPlayer(playerId: number) {
  const [player] = await db
    .select({
      id: playersTable.id,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      suffix: playersTable.suffix,
      slug: playersTable.slug,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      highSchoolName: playersTable.highSchoolName,
      hsGradYear: playersTable.hsGradYear,
      mergedIntoId: playersTable.mergedIntoId,
      hiddenAt: playersTable.hiddenAt,
      pendingSince: playersTable.pendingSince,
    })
    .from(playersTable)
    .where(eq(playersTable.id, playerId));
  if (!player) return null;

  const sports = await db
    .select({
      id: playerSportsTable.id,
      sportId: playerSportsTable.sportId,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
      position: playerSportsTable.position,
      heightIn: playerSportsTable.heightIn,
      weightLb: playerSportsTable.weightLb,
    })
    .from(playerSportsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, playerSportsTable.sportId))
    .where(eq(playerSportsTable.playerId, playerId))
    .orderBy(asc(sportsTable.name));
  const playerSportIds = sports.map((sport) => sport.id);

  const enrollments =
    playerSportIds.length === 0
      ? []
      : await db
          .select({
            id: playerEnrollmentsTable.id,
            playerSportId: playerEnrollmentsTable.playerSportId,
            schoolId: playerEnrollmentsTable.schoolId,
            schoolName: sql<string>`coalesce(${schoolsTable.name}, ${playerEnrollmentsTable.schoolName})`,
            startYear: playerEnrollmentsTable.startYear,
            endYear: playerEnrollmentsTable.endYear,
          })
          .from(playerEnrollmentsTable)
          .leftJoin(
            schoolsTable,
            eq(schoolsTable.id, playerEnrollmentsTable.schoolId),
          )
          .where(inArray(playerEnrollmentsTable.playerSportId, playerSportIds))
          .orderBy(
            desc(playerEnrollmentsTable.startYear),
            desc(playerEnrollmentsTable.id),
          );
  const recruitments =
    playerSportIds.length === 0
      ? []
      : await recruitmentsForPlayerSports(playerSportIds, db);
  const events =
    recruitments.length === 0
      ? []
      : await db
          .select({
            id: recruitmentEventsTable.id,
            recruitmentId: recruitmentEventsTable.recruitmentId,
            type: recruitmentEventsTable.type,
            occurredAt: recruitmentEventsTable.occurredAt,
            schoolId: recruitmentEventsTable.schoolId,
            schoolName: sql<
              string | null
            >`coalesce(${schoolsTable.name}, ${recruitmentEventsTable.schoolName})`,
            sourceType: recruitmentEventsTable.sourceType,
            sourceUrl: recruitmentEventsTable.sourceUrl,
            sourceNote: recruitmentEventsTable.sourceNote,
            voidedAt: recruitmentEventsTable.voidedAt,
            voidReason: recruitmentEventsTable.voidReason,
          })
          .from(recruitmentEventsTable)
          .leftJoin(
            schoolsTable,
            eq(schoolsTable.id, recruitmentEventsTable.schoolId),
          )
          .where(
            inArray(
              recruitmentEventsTable.recruitmentId,
              recruitments.map((recruitment) => recruitment.id),
            ),
          )
          .orderBy(
            asc(recruitmentEventsTable.occurredAt),
            asc(recruitmentEventsTable.id),
          );

  return {
    ...player,
    sports: sports.map((sport) => ({
      ...sport,
      enrollments: enrollments.filter(
        (enrollment) => enrollment.playerSportId === sport.id,
      ),
      recruitments: recruitments
        .filter((recruitment) => recruitment.playerSportId === sport.id)
        .map((recruitment) => ({
          ...recruitment,
          events: events.filter(
            (event) => event.recruitmentId === recruitment.id,
          ),
        })),
    })),
  };
}

export type PortalPlayerDetail = NonNullable<
  Awaited<ReturnType<typeof getPortalPlayer>>
>;

export type PortalEntryInput = Omit<
  OpenRecruitmentInput,
  "playerId" | "actorUserId"
>;

/** At most this many "not the same person" pairs per new player. */
const MAX_NOT_DUPLICATE_OF = 20;

/**
 * Create a player, and their portal entry when given, in one transaction: a
 * refused entry (wrong position, say) leaves no half-made player behind.
 *
 * `notDuplicateOf` is the similar players the admin was shown and said were
 * different people. Each pair is stored as a dismissal so the duplicate queue
 * doesn't flag it again. Ids that don't exist are skipped.
 */
export async function createPortalPlayer(
  input: CreatePlayerInput & {
    entry?: PortalEntryInput | null;
    notDuplicateOf?: number[];
  },
) {
  return db.transaction(async (tx) => {
    const player = await createPlayer(tx, input);
    await lockPlayer(tx, player.id);
    const others = [...new Set(input.notDuplicateOf ?? [])]
      .filter((id) => Number.isSafeInteger(id) && id !== player.id)
      .slice(0, MAX_NOT_DUPLICATE_OF);
    if (others.length > 0) {
      await tx.execute(sql`
        insert into public.player_duplicate_dismissals
          (player_a_id, player_b_id, dismissed_by_user_id)
        select least(p.id, ${player.id}::bigint), greatest(p.id, ${player.id}::bigint),
               ${input.actorUserId ?? null}
        from public.players p
        where p.id in ${others}
        on conflict (player_a_id, player_b_id) do nothing
      `);
    }
    if (input.entry) {
      await openRecruitmentLocked(tx, {
        ...input.entry,
        playerId: player.id,
        actorUserId: input.actorUserId,
      });
    }
    return { id: player.id, slug: player.slug };
  });
}

export interface UpdatePlayerBioInput {
  playerId: number;
  firstName: string;
  lastName: string;
  suffix?: string | null;
  hometownCity?: string | null;
  hometownState?: string | null;
  highSchoolName?: string | null;
  hsGradYear?: number | null;
  actorUserId?: string | null;
}

/** Fix a name or bio field. A name change changes the slug; the old URL redirects by id. */
export async function updatePlayerBio(input: UpdatePlayerBioInput) {
  return db.transaction(async (tx) => {
    await lockPlayer(tx, input.playerId);
    await requireActivePlayer(tx, input.playerId);
    const bioColumns = {
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      suffix: playersTable.suffix,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      highSchoolName: playersTable.highSchoolName,
      hsGradYear: playersTable.hsGradYear,
    };
    const [before] = await tx
      .select(bioColumns)
      .from(playersTable)
      .where(eq(playersTable.id, input.playerId));

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const suffix = input.suffix?.trim() || null;
    const [after] = await tx
      .update(playersTable)
      .set({
        firstName,
        lastName,
        suffix,
        slug: playerSlug(firstName, lastName, suffix),
        nameSearch: normalizePlayerName(firstName, lastName, suffix),
        hometownCity: input.hometownCity?.trim() || null,
        hometownState: input.hometownState?.trim() || null,
        highSchoolName: input.highSchoolName?.trim() || null,
        hsGradYear: input.hsGradYear ?? null,
      })
      .where(eq(playersTable.id, input.playerId))
      .returning({ ...bioColumns, slug: playersTable.slug });

    await writePlayerAudit(tx, {
      playerId: input.playerId,
      entity: "players",
      entityId: input.playerId,
      action: "update",
      before,
      after,
      actorUserId: input.actorUserId,
    });
    await markPlayerPending(tx, input.playerId);
    return after;
  });
}

/** Set position, height, or weight for one sport (creating the sport row if needed). */
export async function updatePlayerSport(input: {
  playerId: number;
  sportId: string;
  attributes: PlayerSportAttributes;
  actorUserId?: string | null;
}) {
  return db.transaction(async (tx) => {
    await lockPlayer(tx, input.playerId);
    await requireActivePlayer(tx, input.playerId);
    const row = await ensurePlayerSport(
      tx,
      input.playerId,
      input.sportId,
      input.attributes,
    );
    await writePlayerAudit(tx, {
      playerId: input.playerId,
      entity: "player_sports",
      entityId: row.id,
      action: "update",
      after: input.attributes,
      actorUserId: input.actorUserId,
    });
    await markPlayerPending(tx, input.playerId);
    return row;
  });
}

/** Schools by name for the admin pickers. */
export async function searchPortalSchools(query: string, limit = 10) {
  const needle = query.trim().replaceAll("%", "").replaceAll("_", "");
  if (needle.length < 2) return [];
  const pattern = `%${needle}%`;
  return db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
    })
    .from(schoolsTable)
    .where(
      sql`${schoolsTable.name} ilike ${pattern} or ${schoolsTable.shortName} ilike ${pattern}`,
    )
    .orderBy(asc(schoolsTable.name))
    .limit(limit);
}
