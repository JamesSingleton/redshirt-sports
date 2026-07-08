import {
  and,
  count,
  desc,
  eq,
  ilike,
  lt,
  max,
  or,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { primaryDb as db } from "../client";
import {
  playersTable,
  schoolsTable,
  sportsTable,
  transferPortalEntriesTable,
} from "../schema";

const fromSchool = alias(schoolsTable, "from_school");
const toSchool = alias(schoolsTable, "to_school");

export type PortalEntryStatus =
  | "ENTERED"
  | "COMMITTED"
  | "SIGNED"
  | "ENROLLED"
  | "WITHDRAWN"
  | "all";

export interface TransferPortalFilters {
  portalYear: number;
  sportSlug?: string;
  schoolId?: string;
  status?: PortalEntryStatus;
  position?: string;
  searchQuery?: string;
}

export interface TransferPortalEntryRow {
  entryId: string;
  eventDate: Date;
  status: string;
  portalYear: number;
  playerId: string;
  playerSlug: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  position: string | null;
  heightInches: number | null;
  weightLbs: number | null;
  headshotUrl: string | null;
  classYear: number | null;
  sportSlug: string | null;
  fromSchoolName: string | null;
  fromSchoolShortName: string | null;
  toSchoolName: string | null;
  toSchoolShortName: string | null;
}

export async function getTransferPortalEntries({
  filters,
  limit = 50,
  cursor,
}: {
  filters: TransferPortalFilters;
  limit?: number;
  cursor?: { eventDate: Date; id: string };
}) {
  const conditions = [eq(transferPortalEntriesTable.portalYear, filters.portalYear)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(transferPortalEntriesTable.status, filters.status));
  }

  if (filters.position && filters.position !== "all") {
    conditions.push(eq(playersTable.position, filters.position));
  }

  if (filters.sportSlug) {
    conditions.push(eq(sportsTable.slug, filters.sportSlug));
  }

  if (filters.schoolId) {
    conditions.push(
      or(
        eq(transferPortalEntriesTable.fromSchoolId, filters.schoolId),
        eq(transferPortalEntriesTable.toSchoolId, filters.schoolId),
      )!,
    );
  }

  if (filters.searchQuery?.trim()) {
    const query = `%${filters.searchQuery.trim()}%`;
    conditions.push(
      or(
        ilike(playersTable.firstName, query),
        ilike(playersTable.lastName, query),
        ilike(playersTable.displayName, query),
      )!,
    );
  }

  if (cursor) {
    conditions.push(
      or(
        lt(transferPortalEntriesTable.eventDate, cursor.eventDate),
        and(
          eq(transferPortalEntriesTable.eventDate, cursor.eventDate),
          lt(transferPortalEntriesTable.id, cursor.id),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      entryId: transferPortalEntriesTable.id,
      eventDate: transferPortalEntriesTable.eventDate,
      status: transferPortalEntriesTable.status,
      portalYear: transferPortalEntriesTable.portalYear,
      playerId: playersTable.id,
      playerSlug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      position: playersTable.position,
      heightInches: playersTable.heightInches,
      weightLbs: playersTable.weightLbs,
      headshotUrl: playersTable.headshotUrl,
      classYear: playersTable.classYear,
      sportSlug: sportsTable.slug,
      fromSchoolName: fromSchool.name,
      fromSchoolShortName: fromSchool.shortName,
      toSchoolName: toSchool.name,
      toSchoolShortName: toSchool.shortName,
    })
    .from(transferPortalEntriesTable)
    .innerJoin(playersTable, eq(transferPortalEntriesTable.playerId, playersTable.id))
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(fromSchool, eq(transferPortalEntriesTable.fromSchoolId, fromSchool.id))
    .leftJoin(toSchool, eq(transferPortalEntriesTable.toSchoolId, toSchool.id))
    .where(and(...conditions))
    .orderBy(
      desc(transferPortalEntriesTable.eventDate),
      desc(transferPortalEntriesTable.id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data.at(-1);

  return {
    data,
    hasMore,
    nextCursor:
      hasMore && last
        ? { eventDate: last.eventDate, id: last.entryId }
        : null,
  };
}

export async function getLatestPortalYear(sportSlug?: string) {
  const conditions = sportSlug
    ? [eq(sportsTable.slug, sportSlug)]
    : [];

  const query = db
    .select({ latestYear: max(transferPortalEntriesTable.portalYear) })
    .from(transferPortalEntriesTable)
    .innerJoin(playersTable, eq(transferPortalEntriesTable.playerId, playersTable.id))
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id));

  const result = await (conditions.length
    ? query.where(and(...conditions))
    : query);

  const latestYear = result[0]?.latestYear;
  if (latestYear != null) {
    return latestYear;
  }

  return new Date().getFullYear();
}

export async function getAvailablePortalYears(sportSlug?: string) {
  const conditions = sportSlug
    ? [eq(sportsTable.slug, sportSlug)]
    : [];

  const query = db
    .selectDistinct({ portalYear: transferPortalEntriesTable.portalYear })
    .from(transferPortalEntriesTable)
    .innerJoin(playersTable, eq(transferPortalEntriesTable.playerId, playersTable.id))
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .orderBy(desc(transferPortalEntriesTable.portalYear));

  const rows = await (conditions.length
    ? query.where(and(...conditions))
    : query);

  return rows.map((row) => row.portalYear);
}

export async function getSchoolIdBySanityId(sanityId: string) {
  const result = await db
    .select({ id: schoolsTable.id })
    .from(schoolsTable)
    .where(eq(schoolsTable.sanityId, sanityId))
    .limit(1);

  return result[0]?.id ?? null;
}

export async function getPortalStatusCounts(portalYear: number) {
  const rows = await db
    .select({
      status: transferPortalEntriesTable.status,
      total: count(),
    })
    .from(transferPortalEntriesTable)
    .where(eq(transferPortalEntriesTable.portalYear, portalYear))
    .groupBy(transferPortalEntriesTable.status);

  return Object.fromEntries(rows.map((row) => [row.status, row.total]));
}

export async function searchRecruitingPlayers({
  sportSlug,
  query,
  limit = 25,
}: {
  sportSlug?: string;
  query?: string;
  limit?: number;
}) {
  const conditions = [];

  if (sportSlug) {
    conditions.push(eq(sportsTable.slug, sportSlug));
  }

  if (query?.trim()) {
    const pattern = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(playersTable.firstName, pattern),
        ilike(playersTable.lastName, pattern),
        ilike(playersTable.displayName, pattern),
        ilike(playersTable.hometown, pattern),
      )!,
    );
  }

  return db
    .select({
      id: playersTable.id,
      slug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      position: playersTable.position,
      classYear: playersTable.classYear,
      hometown: playersTable.hometown,
      headshotUrl: playersTable.headshotUrl,
      currentStatus: playersTable.currentStatus,
      sportSlug: sportsTable.slug,
      schoolName: schoolsTable.name,
      schoolShortName: schoolsTable.shortName,
    })
    .from(playersTable)
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(schoolsTable, eq(playersTable.committedSchoolId, schoolsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(playersTable.lastName, playersTable.firstName)
    .limit(limit);
}

export async function listRecruitingPlayersByClassYear({
  sportSlug,
  classYear,
  limit = 100,
}: {
  sportSlug: string;
  classYear: number;
  limit?: number;
}) {
  return db
    .select({
      id: playersTable.id,
      slug: playersTable.slug,
      firstName: playersTable.firstName,
      lastName: playersTable.lastName,
      displayName: playersTable.displayName,
      position: playersTable.position,
      classYear: playersTable.classYear,
      hometown: playersTable.hometown,
      headshotUrl: playersTable.headshotUrl,
      currentStatus: playersTable.currentStatus,
      sportSlug: sportsTable.slug,
      schoolName: schoolsTable.name,
      schoolShortName: schoolsTable.shortName,
    })
    .from(playersTable)
    .innerJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(schoolsTable, eq(playersTable.committedSchoolId, schoolsTable.id))
    .where(
      and(eq(sportsTable.slug, sportSlug), eq(playersTable.classYear, classYear)),
    )
    .orderBy(playersTable.lastName, playersTable.firstName)
    .limit(limit);
}
