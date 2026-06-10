import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  or,
} from "drizzle-orm";

import { primaryDb as db } from "../client";
import { getPlayerHeadshotUrl } from "../storage/player-headshots";
import {
  highSchoolsTable,
  playerCollegeAffiliationsTable,
  playerSportProfilesTable,
  playersTable,
  schoolsTable,
  sportsTable,
  transferPortalCyclesTable,
  transferPortalEntriesTable,
  TRANSFER_PORTAL_STATUS,
  type TransferPortalStatus,
} from "../schema";
import { formatHeightInches } from "../utils/player-profile-path";

export type TransferPortalWireParams = {
  sportSlug: string;
  portalYear: number;
  schoolId?: string;
  position?: string;
  status?: TransferPortalStatus;
  offset?: number;
  limit?: number;
};

async function getCycleBySportAndYear(sportSlug: string, portalYear: number) {
  return db
    .select({
      id: transferPortalCyclesTable.id,
      sportId: transferPortalCyclesTable.sportId,
      portalYear: transferPortalCyclesTable.portalYear,
      name: transferPortalCyclesTable.name,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
    })
    .from(transferPortalCyclesTable)
    .innerJoin(sportsTable, eq(transferPortalCyclesTable.sportId, sportsTable.id))
    .where(
      and(
        eq(sportsTable.slug, sportSlug),
        eq(transferPortalCyclesTable.portalYear, portalYear),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function getLatestEntryIdsForCycle(cycleId: string): Promise<string[]> {
  const entries = await db
    .select({
      id: transferPortalEntriesTable.id,
      playerId: transferPortalEntriesTable.playerId,
      sequenceInCycle: transferPortalEntriesTable.sequenceInCycle,
    })
    .from(transferPortalEntriesTable)
    .where(eq(transferPortalEntriesTable.cycleId, cycleId));

  const latestByPlayer = new Map<string, { id: string; sequence: number }>();

  for (const entry of entries) {
    const current = latestByPlayer.get(entry.playerId);
    if (!current || entry.sequenceInCycle > current.sequence) {
      latestByPlayer.set(entry.playerId, {
        id: entry.id,
        sequence: entry.sequenceInCycle,
      });
    }
  }

  return [...latestByPlayer.values()].map((value) => value.id);
}

export async function getTransferPortalWire({
  sportSlug,
  portalYear,
  schoolId,
  position,
  status,
  offset = 0,
  limit = 50,
}: TransferPortalWireParams) {
  const cycle = await getCycleBySportAndYear(sportSlug, portalYear);

  if (!cycle) {
    return {
      cycle: null,
      summary: {
        enteredCount: 0,
        committedCount: 0,
        signedCount: 0,
        enrolledCount: 0,
        withdrawnCount: 0,
        committedPct: 0,
        withdrawnPct: 0,
      },
      pagination: { count: 0, offset, limit },
      list: [],
    };
  }

  const latestEntryIds = await getLatestEntryIdsForCycle(cycle.id);

  if (latestEntryIds.length === 0) {
    return {
      cycle,
      summary: {
        enteredCount: 0,
        committedCount: 0,
        signedCount: 0,
        enrolledCount: 0,
        withdrawnCount: 0,
        committedPct: 0,
        withdrawnPct: 0,
      },
      pagination: { count: 0, offset, limit },
      list: [],
    };
  }

  const baseFilters = [inArray(transferPortalEntriesTable.id, latestEntryIds)];

  if (status) {
    baseFilters.push(eq(transferPortalEntriesTable.status, status));
  }

  if (schoolId) {
    baseFilters.push(
      or(
        eq(transferPortalEntriesTable.fromSchoolId, schoolId),
        eq(transferPortalEntriesTable.committedSchoolId, schoolId),
      )!,
    );
  }

  const whereClause = and(...baseFilters);
  const fromSchool = schoolsTable;
  const sportProfileJoin = and(
    eq(playerSportProfilesTable.playerId, playersTable.id),
    eq(playerSportProfilesTable.sportId, sportsTable.id),
  );
  const listWhere = position
    ? and(whereClause, eq(playerSportProfilesTable.primaryPosition, position))
    : whereClause;

  const listQuery = db
    .select({
      entryId: transferPortalEntriesTable.id,
      status: transferPortalEntriesTable.status,
      statusDate: transferPortalEntriesTable.statusDate,
      sequenceInCycle: transferPortalEntriesTable.sequenceInCycle,
      enteredAt: transferPortalEntriesTable.enteredAt,
      isGraduateTransfer: transferPortalEntriesTable.isGraduateTransfer,
      playerId: playersTable.id,
      publicId: playersTable.publicId,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      height: playersTable.height,
      weight: playersTable.weight,
      headshotBucket: playersTable.headshotBucket,
      headshotPath: playersTable.headshotPath,
      hometownCity: playersTable.hometownCity,
      hometownState: playersTable.hometownState,
      highSchoolName: highSchoolsTable.name,
      highSchoolNameOverride: playersTable.highSchoolNameOverride,
      primaryPosition: playerSportProfilesTable.primaryPosition,
      classStanding: playerSportProfilesTable.classStanding,
      fromSchoolId: transferPortalEntriesTable.fromSchoolId,
      fromSchoolName: fromSchool.name,
      fromSchoolShortName: fromSchool.shortName,
      committedSchoolId: transferPortalEntriesTable.committedSchoolId,
    })
    .from(transferPortalEntriesTable)
    .innerJoin(playersTable, eq(transferPortalEntriesTable.playerId, playersTable.id))
    .innerJoin(fromSchool, eq(transferPortalEntriesTable.fromSchoolId, fromSchool.id))
    .innerJoin(
      transferPortalCyclesTable,
      eq(transferPortalEntriesTable.cycleId, transferPortalCyclesTable.id),
    )
    .innerJoin(sportsTable, eq(transferPortalCyclesTable.sportId, sportsTable.id))
    .leftJoin(highSchoolsTable, eq(playersTable.highSchoolId, highSchoolsTable.id))
    .leftJoin(playerSportProfilesTable, sportProfileJoin)
    .where(listWhere)
    .orderBy(desc(transferPortalEntriesTable.statusDate))
    .offset(offset)
    .limit(limit);

  const [list, totalResult, summaryRows] = await Promise.all([
    listQuery,
    db
      .select({ value: count() })
      .from(transferPortalEntriesTable)
      .innerJoin(playersTable, eq(transferPortalEntriesTable.playerId, playersTable.id))
      .leftJoin(playerSportProfilesTable, sportProfileJoin)
      .innerJoin(
        transferPortalCyclesTable,
        eq(transferPortalEntriesTable.cycleId, transferPortalCyclesTable.id),
      )
      .innerJoin(sportsTable, eq(transferPortalCyclesTable.sportId, sportsTable.id))
      .where(listWhere),
    db
      .select({
        status: transferPortalEntriesTable.status,
        value: count(),
      })
      .from(transferPortalEntriesTable)
      .where(inArray(transferPortalEntriesTable.id, latestEntryIds))
      .groupBy(transferPortalEntriesTable.status),
  ]);

  const playerIds = list.map((row) => row.playerId);
  const affiliations =
    playerIds.length > 0
      ? await db
          .select({
            playerId: playerCollegeAffiliationsTable.playerId,
            schoolName: schoolsTable.name,
            schoolShortName: schoolsTable.shortName,
            startYear: playerCollegeAffiliationsTable.startYear,
            endYear: playerCollegeAffiliationsTable.endYear,
            isTransfer: playerCollegeAffiliationsTable.isTransfer,
            sortOrder: playerCollegeAffiliationsTable.sortOrder,
          })
          .from(playerCollegeAffiliationsTable)
          .innerJoin(
            schoolsTable,
            eq(playerCollegeAffiliationsTable.schoolId, schoolsTable.id),
          )
          .where(
            and(
              inArray(playerCollegeAffiliationsTable.playerId, playerIds),
              eq(playerCollegeAffiliationsTable.sportId, cycle.sportId),
            ),
          )
          .orderBy(asc(playerCollegeAffiliationsTable.sortOrder))
      : [];

  const affiliationsByPlayer = new Map<string, typeof affiliations>();
  for (const affiliation of affiliations) {
    const existing = affiliationsByPlayer.get(affiliation.playerId) ?? [];
    existing.push(affiliation);
    affiliationsByPlayer.set(affiliation.playerId, existing);
  }

  const statusCounts = Object.fromEntries(
    summaryRows.map((row) => [row.status, row.value]),
  ) as Record<string, number>;

  const enteredCount = statusCounts[TRANSFER_PORTAL_STATUS.ENTERED] ?? 0;
  const committedCount = statusCounts[TRANSFER_PORTAL_STATUS.COMMITTED] ?? 0;
  const signedCount = statusCounts[TRANSFER_PORTAL_STATUS.SIGNED] ?? 0;
  const enrolledCount = statusCounts[TRANSFER_PORTAL_STATUS.ENROLLED] ?? 0;
  const withdrawnCount = statusCounts[TRANSFER_PORTAL_STATUS.WITHDRAWN] ?? 0;
  const totalLatest =
    enteredCount + committedCount + signedCount + enrolledCount + withdrawnCount;
  const inPortalCount = enteredCount + committedCount + signedCount;

  return {
    cycle,
    summary: {
      enteredCount: inPortalCount,
      committedCount: committedCount + signedCount + enrolledCount,
      signedCount,
      enrolledCount,
      withdrawnCount,
      committedPct:
        totalLatest > 0
          ? Math.round(
              ((committedCount + signedCount + enrolledCount) / totalLatest) *
                10000,
            ) / 100
          : 0,
      withdrawnPct:
        totalLatest > 0
          ? Math.round((withdrawnCount / totalLatest) * 10000) / 100
          : 0,
    },
    pagination: {
      count: totalResult[0]?.value ?? 0,
      offset,
      limit,
    },
    list: list.map((row) => ({
      entryId: row.entryId,
      status: row.status,
      statusDate: row.statusDate,
      sequenceInCycle: row.sequenceInCycle,
      enteredAt: row.enteredAt,
      isGraduateTransfer: row.isGraduateTransfer,
      player: {
        id: row.playerId,
        publicId: row.publicId,
        firstName: row.firstName,
        lastName: row.lastName,
        displayName: row.displayName,
        height: row.height,
        heightDisplay: formatHeightInches(row.height),
        weight: row.weight,
        headshotUrl: getPlayerHeadshotUrl(row),
        hometownCity: row.hometownCity,
        hometownState: row.hometownState,
        highSchoolDisplay:
          row.highSchoolName ?? row.highSchoolNameOverride ?? null,
        primaryPosition: row.primaryPosition,
        classStanding: row.classStanding,
      },
      fromSchool: {
        id: row.fromSchoolId,
        name: row.fromSchoolName,
        shortName: row.fromSchoolShortName,
      },
      committedSchoolId: row.committedSchoolId,
      organizationHistory: affiliationsByPlayer.get(row.playerId) ?? [],
    })),
  };
}

export async function getPlayerPortalHistory(playerId: string) {
  return db.query.transferPortalEntriesTable.findMany({
    where: (model, { eq: eqOp }) => eqOp(model.playerId, playerId),
    orderBy: (model, { asc: ascOp, desc: descOp }) => [
      descOp(model.enteredAt),
      ascOp(model.sequenceInCycle),
    ],
    with: {
      cycle: {
        with: {
          sport: true,
        },
      },
      fromSchool: true,
      committedSchool: true,
    },
  });
}

export async function updatePortalEntryStatus(
  entryId: string,
  newStatus: TransferPortalStatus,
  payload: {
    statusDate?: Date;
    committedSchoolId?: string | null;
    withdrawnAt?: Date | null;
    signedAt?: Date | null;
    enrolledAt?: Date | null;
    exitedAt?: Date | null;
    lastDecommittedAt?: Date | null;
  } = {},
) {
  const now = payload.statusDate ?? new Date();
  const updates: Partial<typeof transferPortalEntriesTable.$inferInsert> = {
    status: newStatus,
    statusDate: now,
    updatedAt: now,
  };

  if (newStatus === TRANSFER_PORTAL_STATUS.COMMITTED) {
    updates.committedAt = now;
    updates.committedSchoolId = payload.committedSchoolId ?? undefined;
  }

  if (newStatus === TRANSFER_PORTAL_STATUS.ENTERED) {
    updates.committedAt = null;
    updates.committedSchoolId = null;
    if (payload.lastDecommittedAt) {
      updates.lastDecommittedAt = payload.lastDecommittedAt;
    }
  }

  if (newStatus === TRANSFER_PORTAL_STATUS.SIGNED) {
    updates.signedAt = payload.signedAt ?? now;
  }

  if (newStatus === TRANSFER_PORTAL_STATUS.ENROLLED) {
    updates.enrolledAt = payload.enrolledAt ?? now;
    updates.exitedAt = payload.exitedAt ?? now;
  }

  if (newStatus === TRANSFER_PORTAL_STATUS.WITHDRAWN) {
    updates.withdrawnAt = payload.withdrawnAt ?? now;
    updates.exitedAt = payload.exitedAt ?? now;
  }

  const [updated] = await db
    .update(transferPortalEntriesTable)
    .set(updates)
    .where(eq(transferPortalEntriesTable.id, entryId))
    .returning();

  return updated ?? null;
}
