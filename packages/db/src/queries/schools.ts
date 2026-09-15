import { inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { schoolsTable } from "../schema";

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
