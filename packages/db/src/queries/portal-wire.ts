import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  type PublishedWireRow,
  publishedWireRowSchema,
} from "../portal/published";
import {
  type PortalWireData,
  type WireConference,
  type WireLevel,
  type WireSchool,
  wireReferences,
} from "../portal/wire";
import {
  conferenceSportSubdivisionsTable,
  conferencesTable,
  divisionsTable,
  publishedWireEventsTable,
  schoolsTable,
  sportsTable,
} from "../schema";

// Public reads of the published wire. Only the push writes these tables.

/** The sport's id, as a subquery, so the wire filter never follows a join per row. */
const sportIdBySlug = (slug: string) =>
  db
    .select({ id: sportsTable.id })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug));

/** Cycles that have published moves, newest first. */
export async function listPublishedWireCycles(
  sportSlug: string,
  kind = "transfer",
): Promise<number[]> {
  const rows = await db
    .selectDistinct({ cycleYear: publishedWireEventsTable.cycleYear })
    .from(publishedWireEventsTable)
    .where(
      and(
        inArray(publishedWireEventsTable.sportId, sportIdBySlug(sportSlug)),
        eq(publishedWireEventsTable.kind, kind),
      ),
    )
    .orderBy(desc(publishedWireEventsTable.cycleYear));
  return rows.map((row) => Number(row.cycleYear));
}

/**
 * A slim logo: the fields `processImageData` reads, without alt text,
 * caption, or a base64 preview that would ride along in every response.
 */
const slimImage = sql<unknown>`case when ${schoolsTable.image} ? 'asset' then
  jsonb_strip_nulls(jsonb_build_object(
    'asset', ${schoolsTable.image} -> 'asset',
    'width', ${schoolsTable.image} -> 'width',
    'height', ${schoolsTable.image} -> 'height',
    'crop', ${schoolsTable.image} -> 'crop',
    'hotspot', ${schoolsTable.image} -> 'hotspot'))
  end`;

const levelColumns = {
  id: divisionsTable.id,
  name: divisionsTable.name,
  slug: divisionsTable.slug,
  parentId: divisionsTable.parentDivisionId,
};

/**
 * Every level the division filter offers for a sport: the subdivisions its
 * conferences play in (FBS, FCS for football; Power, Mid-Major for
 * basketball), the levels the wire's rows name, and their parent divisions.
 * Built from the sport, not the rows, so FBS is offered before anyone from
 * an FBS school has moved.
 */
async function sportLevels(sportId: string, named: string[]) {
  const subdivisions = await db
    .selectDistinct({ id: conferenceSportSubdivisionsTable.subdivisionId })
    .from(conferenceSportSubdivisionsTable)
    .where(eq(conferenceSportSubdivisionsTable.sportId, sportId));
  const ids = [...new Set([...named, ...subdivisions.map((row) => row.id)])];
  if (ids.length === 0) return [];
  const rows = await levelsById(ids);
  const have = new Set(rows.map((row) => row.id));
  const parents = [
    ...new Set(
      rows
        .map((row) => row.parentId)
        .filter((id): id is string => Boolean(id) && !have.has(id as string)),
    ),
  ];
  if (parents.length > 0) {
    rows.push(...(await levelsById(parents)));
  }
  return rows.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

/** Names and slim logos for these schools, keyed by id. */
export async function schoolDictionary(
  ids: string[],
): Promise<Record<string, WireSchool>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
      slug: schoolsTable.slug,
      image: slimImage,
    })
    .from(schoolsTable)
    .where(inArray(schoolsTable.id, ids));
  return Object.fromEntries(
    rows.map(({ id, ...school }): [string, WireSchool] => [
      id,
      { ...school, image: school.image ?? null },
    ]),
  );
}

/** Conference names, keyed by id. */
export async function conferenceDictionary(
  ids: string[],
): Promise<Record<string, WireConference>> {
  if (ids.length === 0) return {};
  const rows = await db
    .select({
      id: conferencesTable.id,
      name: conferencesTable.name,
      shortName: conferencesTable.shortName,
    })
    .from(conferencesTable)
    .where(inArray(conferencesTable.id, ids));
  return Object.fromEntries(
    rows.map(({ id, ...conference }): [string, WireConference] => [
      id,
      conference,
    ]),
  );
}

type LevelRow = Awaited<ReturnType<typeof levelsById>>[number];

/** These levels, by id. */
export function levelsById(ids: string[]) {
  return db
    .select(levelColumns)
    .from(divisionsTable)
    .where(inArray(divisionsTable.id, ids));
}

export function levelDictionary(rows: LevelRow[]): Record<string, WireLevel> {
  return Object.fromEntries(
    rows.map(({ id, name, slug, parentId }): [string, WireLevel] => [
      id,
      { name: name ?? slug ?? "", slug: slug ?? "", parentId },
    ]),
  );
}

/**
 * Everything the wire shows for one sport and cycle, newest move first.
 * Reads the `(sport_id, kind, cycle_year, occurred_at desc, event_id desc)`
 * index, then the schools, levels, and conferences those rows name. Returns
 * null for a sport that doesn't exist.
 */
export async function getPublishedWire(
  sportSlug: string,
  cycleYear: number,
  kind = "transfer",
): Promise<PortalWireData | null> {
  const [sport] = await db
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
    })
    .from(sportsTable)
    .where(eq(sportsTable.slug, sportSlug));
  if (!sport) return null;

  const stored = await db
    .select({ row: publishedWireEventsTable.row })
    .from(publishedWireEventsTable)
    .where(
      and(
        eq(publishedWireEventsTable.sportId, sport.id),
        eq(publishedWireEventsTable.kind, kind),
        eq(publishedWireEventsTable.cycleYear, cycleYear),
      ),
    )
    .orderBy(
      desc(publishedWireEventsTable.occurredAt),
      desc(publishedWireEventsTable.eventId),
    );

  const rows: PublishedWireRow[] = [];
  for (const { row } of stored) {
    const parsed = publishedWireRowSchema.safeParse(row);
    // A row the site can't read is skipped, not fatal: the rest still shows.
    if (parsed.success) rows.push(parsed.data);
    else console.error("Skipping unreadable published wire row", parsed.error);
  }

  const refs = wireReferences(rows);
  const ids = {
    schools: [...refs.schools],
    levels: [...refs.levels],
    conferences: [...refs.conferences],
  };
  const [schools, levels, conferences] = await Promise.all([
    schoolDictionary(ids.schools),
    sportLevels(sport.id, ids.levels),
    conferenceDictionary(ids.conferences),
  ]);

  return {
    v: 1,
    sport: { slug: sport.slug, name: sport.name },
    cycleYear,
    rows,
    schools,
    levels: levelDictionary(levels),
    conferences,
  };
}
