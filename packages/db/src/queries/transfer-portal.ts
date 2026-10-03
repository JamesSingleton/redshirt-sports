import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { type AnyPgColumn, alias } from "drizzle-orm/pg-core";

import { primaryDb as db } from "../client";
import {
  type AcademicYear,
  conferencesTable,
  highSchoolsTable,
  type InsertPlayer,
  type InsertTransferPortalEntry,
  PORTAL_STATUSES,
  type PortalStatus,
  playersTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
  transferPortalEntriesTable,
} from "../schema";

const fromSchool = alias(schoolsTable, "from_school");
const toSchool = alias(schoolsTable, "to_school");

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type PortalSchool = {
  id: string;
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
  slug: string | null;
  image: unknown;
};

export type PortalPlayerSummary = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  position: string;
  heightInches: number | null;
  weightLbs: number | null;
  academicYear: AcademicYear | null;
  isRedshirt: boolean;
};

export type PortalEntry = {
  id: string;
  portalYear: number;
  status: PortalStatus;
  enteredAt: Date;
  committedAt: Date | null;
  signedAt: Date | null;
  enrolledAt: Date | null;
  withdrawnAt: Date | null;
  eventDate: Date;
  player: PortalPlayerSummary;
  fromSchool: PortalSchool;
  toSchool: PortalSchool | null;
};

type PortalCursor = { eventDate: Date; id: string };

export function encodePortalCursor({ eventDate, id }: PortalCursor) {
  return Buffer.from(`${eventDate.toISOString()}|${id}`).toString("base64url");
}

export function decodePortalCursor(
  cursor: string | null | undefined,
): PortalCursor | null {
  if (!cursor) return null;
  const [iso, id] = Buffer.from(cursor, "base64url").toString().split("|");
  const eventDate = new Date(iso ?? "");
  if (!id || Number.isNaN(eventDate.getTime())) return null;
  return { eventDate, id };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function schoolColumns(table: typeof fromSchool | typeof toSchool) {
  return {
    id: table.id,
    name: table.name,
    shortName: table.shortName,
    abbreviation: table.abbreviation,
    slug: table.slug,
    image: table.image,
  };
}

const playerSummaryColumns = {
  id: playersTable.id,
  slug: playersTable.slug,
  firstName: playersTable.firstName,
  lastName: playersTable.lastName,
  position: playersTable.position,
  heightInches: playersTable.heightInches,
  weightLbs: playersTable.weightLbs,
  academicYear: playersTable.academicYear,
  isRedshirt: playersTable.isRedshirt,
};

const entryColumns = {
  id: transferPortalEntriesTable.id,
  portalYear: transferPortalEntriesTable.portalYear,
  status: transferPortalEntriesTable.status,
  enteredAt: transferPortalEntriesTable.enteredAt,
  committedAt: transferPortalEntriesTable.committedAt,
  signedAt: transferPortalEntriesTable.signedAt,
  enrolledAt: transferPortalEntriesTable.enrolledAt,
  withdrawnAt: transferPortalEntriesTable.withdrawnAt,
  eventDate: transferPortalEntriesTable.eventDate,
  player: playerSummaryColumns,
  fromSchool: schoolColumns(fromSchool),
  toSchool: schoolColumns(toSchool),
};

function selectEntries() {
  return db
    .select(entryColumns)
    .from(transferPortalEntriesTable)
    .innerJoin(
      playersTable,
      eq(transferPortalEntriesTable.playerId, playersTable.id),
    )
    .innerJoin(
      fromSchool,
      eq(transferPortalEntriesTable.fromSchoolId, fromSchool.id),
    )
    .leftJoin(toSchool, eq(transferPortalEntriesTable.toSchoolId, toSchool.id));
}

/** Left joins return an object of nulls; collapse it to `null`. */
function normalizeEntry(
  row: Awaited<ReturnType<typeof selectEntries>>[number],
) {
  return {
    ...row,
    fromSchool: row.fromSchool as PortalSchool,
    toSchool: row.toSchool?.id ? (row.toSchool as PortalSchool) : null,
  } satisfies PortalEntry;
}

export async function getSportBySlug(slug: string) {
  const [sport] = await db
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
      displayName: sportsTable.displayName,
    })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1);
  return sport ?? null;
}

export type PortalEntryFilters = {
  sportId: string;
  portalYear: number;
  status?: PortalStatus;
  position?: string;
  conferenceId?: string;
  search?: string;
  cursor?: string | null;
  limit?: number;
};

export function buildPortalEntryWhere({
  sportId,
  portalYear,
  status,
  position,
  conferenceId,
  search,
  cursor,
}: Omit<PortalEntryFilters, "limit">) {
  const decoded = decodePortalCursor(cursor);

  const conditions: Array<SQL | undefined> = [
    eq(transferPortalEntriesTable.sportId, sportId),
    eq(transferPortalEntriesTable.portalYear, portalYear),
    status ? eq(transferPortalEntriesTable.status, status) : undefined,
    position ? eq(playersTable.position, position) : undefined,
  ];

  if (conferenceId) {
    const inConference = (schoolId: AnyPgColumn) =>
      exists(
        db
          .select({ one: sql`1` })
          .from(schoolConferenceAffiliationsTable)
          .where(
            and(
              eq(schoolConferenceAffiliationsTable.schoolId, schoolId),
              eq(schoolConferenceAffiliationsTable.sportId, sportId),
              eq(schoolConferenceAffiliationsTable.conferenceId, conferenceId),
            ),
          ),
      );
    conditions.push(or(inConference(fromSchool.id), inConference(toSchool.id)));
  }

  const query = search?.trim();
  if (query) {
    conditions.push(
      ilike(
        sql`${playersTable.firstName} || ' ' || ${playersTable.lastName}`,
        `%${escapeLike(query)}%`,
      ),
    );
  }

  if (decoded) {
    conditions.push(
      or(
        lt(transferPortalEntriesTable.eventDate, decoded.eventDate),
        and(
          eq(transferPortalEntriesTable.eventDate, decoded.eventDate),
          lt(transferPortalEntriesTable.id, decoded.id),
        ),
      ),
    );
  }

  return and(...conditions);
}

export async function getTransferPortalEntries({
  limit = DEFAULT_PAGE_SIZE,
  ...filters
}: PortalEntryFilters) {
  const pageSize = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  const rows = await selectEntries()
    .where(buildPortalEntryWhere(filters))
    .orderBy(
      desc(transferPortalEntriesTable.eventDate),
      desc(transferPortalEntriesTable.id),
    )
    .limit(pageSize + 1);

  const page = rows.slice(0, pageSize).map(normalizeEntry);
  const last = page.at(-1);

  return {
    entries: page,
    nextCursor:
      rows.length > pageSize && last
        ? encodePortalCursor({ eventDate: last.eventDate, id: last.id })
        : null,
  };
}

export async function getPortalStatusCounts({
  sportId,
  portalYear,
}: {
  sportId: string;
  portalYear: number;
}) {
  const rows = await db
    .select({ status: transferPortalEntriesTable.status, total: count() })
    .from(transferPortalEntriesTable)
    .where(
      and(
        eq(transferPortalEntriesTable.sportId, sportId),
        eq(transferPortalEntriesTable.portalYear, portalYear),
      ),
    )
    .groupBy(transferPortalEntriesTable.status);

  const counts = Object.fromEntries(
    PORTAL_STATUSES.map((status) => [status, 0]),
  ) as Record<PortalStatus, number>;
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row.total;
    total += row.total;
  }
  return { counts, total };
}

export async function getPortalYears(sportId: string) {
  const rows = await db
    .selectDistinct({ year: transferPortalEntriesTable.portalYear })
    .from(transferPortalEntriesTable)
    .where(eq(transferPortalEntriesTable.sportId, sportId))
    .orderBy(desc(transferPortalEntriesTable.portalYear));
  return rows.map((row) => row.year);
}

export async function getPortalPositions({
  sportId,
  portalYear,
}: {
  sportId: string;
  portalYear: number;
}) {
  const rows = await db
    .selectDistinct({ position: playersTable.position })
    .from(transferPortalEntriesTable)
    .innerJoin(
      playersTable,
      eq(transferPortalEntriesTable.playerId, playersTable.id),
    )
    .where(
      and(
        eq(transferPortalEntriesTable.sportId, sportId),
        eq(transferPortalEntriesTable.portalYear, portalYear),
      ),
    )
    .orderBy(asc(playersTable.position));
  return rows.map((row) => row.position);
}

export async function getPortalConferences(sportId: string) {
  return db
    .selectDistinct({
      id: conferencesTable.id,
      name: conferencesTable.name,
      shortName: conferencesTable.shortName,
    })
    .from(conferencesTable)
    .innerJoin(
      schoolConferenceAffiliationsTable,
      eq(schoolConferenceAffiliationsTable.conferenceId, conferencesTable.id),
    )
    .where(eq(schoolConferenceAffiliationsTable.sportId, sportId))
    .orderBy(asc(conferencesTable.name));
}

export async function getPlayerBySlug(slug: string) {
  const [player] = await db
    .select({
      ...playerSummaryColumns,
      hometown: playersTable.hometown,
      sport: {
        id: sportsTable.id,
        slug: sportsTable.slug,
        name: sportsTable.name,
      },
      highSchool: {
        id: highSchoolsTable.id,
        name: highSchoolsTable.name,
        city: highSchoolsTable.city,
        state: highSchoolsTable.state,
      },
    })
    .from(playersTable)
    .innerJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(
      highSchoolsTable,
      eq(playersTable.highSchoolId, highSchoolsTable.id),
    )
    .where(eq(playersTable.slug, slug))
    .limit(1);

  if (!player) return null;
  return {
    ...player,
    highSchool: player.highSchool?.id ? player.highSchool : null,
  };
}

export async function getPlayerPortalHistory(playerId: string) {
  const rows = await selectEntries()
    .where(eq(transferPortalEntriesTable.playerId, playerId))
    .orderBy(desc(transferPortalEntriesTable.portalYear));
  return rows.map(normalizeEntry);
}

export async function getTransfersBySchool({
  schoolId,
  portalYear,
}: {
  schoolId: string;
  portalYear?: number;
}) {
  const yearCondition = portalYear
    ? eq(transferPortalEntriesTable.portalYear, portalYear)
    : undefined;

  const rows = await selectEntries()
    .where(
      and(
        or(
          eq(transferPortalEntriesTable.fromSchoolId, schoolId),
          eq(transferPortalEntriesTable.toSchoolId, schoolId),
        ),
        yearCondition,
      ),
    )
    .orderBy(desc(transferPortalEntriesTable.eventDate));

  const entries = rows.map(normalizeEntry);
  return {
    incoming: entries.filter((entry) => entry.toSchool?.id === schoolId),
    outgoing: entries.filter((entry) => entry.fromSchool.id === schoolId),
  };
}

/* Admin reads and writes */

export async function listPlayersForAdmin({
  search,
  limit = 50,
}: {
  search?: string;
  limit?: number;
}) {
  const query = search?.trim();
  return db
    .select({
      ...playerSummaryColumns,
      hometown: playersTable.hometown,
      sportId: playersTable.sportId,
      sportName: sportsTable.name,
    })
    .from(playersTable)
    .innerJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .where(
      query
        ? ilike(
            sql`${playersTable.firstName} || ' ' || ${playersTable.lastName}`,
            `%${escapeLike(query)}%`,
          )
        : undefined,
    )
    .orderBy(asc(playersTable.lastName), asc(playersTable.firstName))
    .limit(Math.min(limit, MAX_PAGE_SIZE));
}

export async function getPlayerForAdmin(id: string) {
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, id))
    .limit(1);
  return player ?? null;
}

export async function listPortalEntriesForAdmin({
  portalYear,
  limit = MAX_PAGE_SIZE,
}: {
  portalYear?: number;
  limit?: number;
}) {
  const rows = await selectEntries()
    .where(
      portalYear
        ? eq(transferPortalEntriesTable.portalYear, portalYear)
        : undefined,
    )
    .orderBy(desc(transferPortalEntriesTable.eventDate))
    .limit(Math.min(limit, MAX_PAGE_SIZE));
  return rows.map(normalizeEntry);
}

export async function getPortalEntryForAdmin(id: string) {
  const [entry] = await db
    .select({
      entry: transferPortalEntriesTable,
      playerSlug: playersTable.slug,
      sportSlug: sportsTable.slug,
    })
    .from(transferPortalEntriesTable)
    .innerJoin(
      playersTable,
      eq(transferPortalEntriesTable.playerId, playersTable.id),
    )
    .innerJoin(
      sportsTable,
      eq(transferPortalEntriesTable.sportId, sportsTable.id),
    )
    .where(eq(transferPortalEntriesTable.id, id))
    .limit(1);
  return entry ?? null;
}

export async function listSchoolOptions() {
  return db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
    })
    .from(schoolsTable)
    .orderBy(asc(schoolsTable.name));
}

export async function listSportOptions() {
  return db
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
    })
    .from(sportsTable)
    .orderBy(asc(sportsTable.name));
}

export type PlayerInput = Omit<InsertPlayer, "id" | "createdAt" | "updatedAt">;

export async function createPlayer(input: PlayerInput) {
  const [player] = await db.insert(playersTable).values(input).returning();
  return player;
}

export async function updatePlayer(id: string, input: Partial<PlayerInput>) {
  const [player] = await db
    .update(playersTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(playersTable.id, id))
    .returning();
  return player ?? null;
}

export async function deletePlayer(id: string) {
  const [player] = await db
    .delete(playersTable)
    .where(eq(playersTable.id, id))
    .returning({ id: playersTable.id, slug: playersTable.slug });
  return player ?? null;
}

export type PortalEntryInput = Omit<
  InsertTransferPortalEntry,
  "id" | "createdAt" | "updatedAt" | "eventDate"
>;

/** The latest status timestamp drives wire ordering. */
export function derivePortalEventDate(
  entry: Pick<
    PortalEntryInput,
    "enteredAt" | "committedAt" | "signedAt" | "enrolledAt" | "withdrawnAt"
  >,
) {
  const dates = [
    entry.enteredAt,
    entry.committedAt,
    entry.signedAt,
    entry.enrolledAt,
    entry.withdrawnAt,
  ].filter((date): date is Date => date instanceof Date);
  let latest = dates[0] ?? new Date();
  for (const date of dates) {
    if (date > latest) latest = date;
  }
  return latest;
}

export async function createPortalEntry(input: PortalEntryInput) {
  const [entry] = await db
    .insert(transferPortalEntriesTable)
    .values({ ...input, eventDate: derivePortalEventDate(input) })
    .returning();
  return entry;
}

export async function updatePortalEntry(id: string, input: PortalEntryInput) {
  const [entry] = await db
    .update(transferPortalEntriesTable)
    .set({
      ...input,
      eventDate: derivePortalEventDate(input),
      updatedAt: new Date(),
    })
    .where(eq(transferPortalEntriesTable.id, id))
    .returning();
  return entry ?? null;
}

export async function deletePortalEntry(id: string) {
  const [entry] = await db
    .delete(transferPortalEntriesTable)
    .where(eq(transferPortalEntriesTable.id, id))
    .returning();
  return entry ?? null;
}
