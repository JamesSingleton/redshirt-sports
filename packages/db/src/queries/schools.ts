import { eq, inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  conferencesTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
} from "../schema";

export type SchoolBySanityId = {
  id: string;
  top25Eligible: boolean | null;
};

export async function getSchoolsBySanityIds(sanityIds: string[]) {
  if (sanityIds.length === 0) return new Map<string, SchoolBySanityId>();

  const schools = await db
    .select({
      id: schoolsTable.id,
      sanityId: schoolsTable.sanityId,
      top25Eligible: schoolsTable.top25Eligible,
    })
    .from(schoolsTable)
    .where(inArray(schoolsTable.sanityId, sanityIds));

  return new Map(
    schools
      .filter(
        (
          s,
        ): s is {
          id: string;
          sanityId: string;
          top25Eligible: boolean | null;
        } => !!s.sanityId,
      )
      .map((s) => [s.sanityId, { id: s.id, top25Eligible: s.top25Eligible }]),
  );
}

/** @deprecated Prefer getSchoolsBySanityIds when eligibility is needed. */
export async function getSchoolIdsBySanityIds(sanityIds: string[]) {
  const schools = await getSchoolsBySanityIds(sanityIds);
  return new Map(
    [...schools.entries()].map(([sanityId, s]) => [sanityId, s.id]),
  );
}

export type SchoolRankingsDisplay = {
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
  slug: string | null;
  image: unknown;
  top25Eligible: boolean | null;
};

export async function getSchoolRankingsDisplayBySanityId(sanityId: string) {
  const [row] = await db
    .select({
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
      slug: schoolsTable.slug,
      image: schoolsTable.image,
      top25Eligible: schoolsTable.top25Eligible,
    })
    .from(schoolsTable)
    .where(eq(schoolsTable.sanityId, sanityId))
    .limit(1);

  return row ?? null;
}

export type SanitySchoolSyncPayload = {
  sanityId: string;
  name?: string | null;
  shortName?: string | null;
  abbreviation?: string | null;
  nickname?: string | null;
  slug?: string | null;
  image?: unknown;
  top25Eligible?: boolean | null;
};

/**
 * Drop LQIP data URIs and palette blobs before storing school logos.
 * Browsers cannot cache `data:` previews; they dominated jsonb payload size.
 */
export function stripSchoolLogoImage(image: unknown): unknown {
  if (image == null || typeof image !== "object" || Array.isArray(image)) {
    return image ?? null;
  }

  const {
    preview: _preview,
    lqip: _lqip,
    dominantColor: _dominantColor,
    ...rest
  } = image as Record<string, unknown>;

  return rest;
}

export async function upsertSchoolFromSanity(payload: SanitySchoolSyncPayload) {
  const values = {
    name: payload.name ?? null,
    shortName: payload.shortName ?? null,
    abbreviation: payload.abbreviation ?? null,
    nickname: payload.nickname ?? null,
    slug: payload.slug ?? null,
    image: stripSchoolLogoImage(payload.image),
    top25Eligible: payload.top25Eligible ?? null,
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(schoolsTable)
    .values({
      sanityId: payload.sanityId,
      ...values,
    })
    .onConflictDoUpdate({
      target: schoolsTable.sanityId,
      set: values,
    })
    .returning({
      id: schoolsTable.id,
      inserted: sql<boolean>`xmax = 0`,
    });

  if (!row) {
    throw new Error("School upsert did not return a row");
  }

  const inserted = row.inserted === true || `${row.inserted}` === "t";

  return {
    action: inserted ? ("inserted" as const) : ("updated" as const),
    id: row.id,
  };
}

/** One row of a Sanity school's `conferenceAffiliations`, by Sanity ids. */
export type SanityConferenceAffiliation = {
  conferenceId?: string | null;
  sportId?: string | null;
};

/**
 * Makes a school's conference affiliations in Postgres match Sanity, the
 * source of truth. Sanity conference ids map to Postgres rows by
 * `sanity_id`; sport ids are the same in both. A conference Postgres
 * doesn't have yet (created in Sanity, not loaded) is skipped and
 * returned, so the caller can report it; run the admin conference loader.
 */
export async function replaceSchoolConferenceAffiliations(
  schoolId: string,
  affiliations: SanityConferenceAffiliation[],
) {
  const wanted = affiliations.filter(
    (row): row is { conferenceId: string; sportId: string } =>
      Boolean(row.conferenceId && row.sportId),
  );
  const conferenceSanityIds = [
    ...new Set(wanted.map((row) => row.conferenceId)),
  ];
  const sportIds = [...new Set(wanted.map((row) => row.sportId))];

  return db.transaction(async (tx) => {
    const conferences = conferenceSanityIds.length
      ? await tx
          .select({
            id: conferencesTable.id,
            sanityId: conferencesTable.sanityId,
          })
          .from(conferencesTable)
          .where(inArray(conferencesTable.sanityId, conferenceSanityIds))
      : [];
    const sports = sportIds.length
      ? await tx
          .select({ id: sportsTable.id })
          .from(sportsTable)
          .where(inArray(sportsTable.id, sportIds))
      : [];
    const conferenceIdBySanityId = new Map(
      conferences.map((row) => [row.sanityId, row.id]),
    );
    const knownSports = new Set(sports.map((row) => row.id));

    const rows: Array<{
      schoolId: string;
      sportId: string;
      conferenceId: string;
    }> = [];
    const skipped: SanityConferenceAffiliation[] = [];
    const seen = new Set<string>();
    for (const row of wanted) {
      const conferenceId = conferenceIdBySanityId.get(row.conferenceId);
      if (!conferenceId || !knownSports.has(row.sportId)) {
        skipped.push(row);
        continue;
      }
      const key = `${row.sportId}|${conferenceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ schoolId, sportId: row.sportId, conferenceId });
    }

    await tx
      .delete(schoolConferenceAffiliationsTable)
      .where(eq(schoolConferenceAffiliationsTable.schoolId, schoolId));
    if (rows.length > 0) {
      await tx.insert(schoolConferenceAffiliationsTable).values(rows);
    }

    return { replaced: rows.length, skipped };
  });
}
