import { eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { schoolsTable } from "../schema";

export async function getSchoolIdsBySanityIds(sanityIds: string[]) {
  if (sanityIds.length === 0) return new Map<string, string>();

  const schools = await db
    .select({
      id: schoolsTable.id,
      sanityId: schoolsTable.sanityId,
    })
    .from(schoolsTable)
    .where(inArray(schoolsTable.sanityId, sanityIds));

  return new Map(
    schools
      .filter((s): s is { id: string; sanityId: string } => !!s.sanityId)
      .map((s) => [s.sanityId, s.id]),
  );
}

export type SanitySchoolSyncPayload = {
  sanityId: string;
  name?: string | null;
  shortName?: string | null;
  abbreviation?: string | null;
  nickname?: string | null;
  image?: unknown;
  top25Eligible?: boolean | null;
};

export async function upsertSchoolFromSanity(payload: SanitySchoolSyncPayload) {
  const existing = await db.query.schoolsTable.findFirst({
    where: (model, { eq }) => eq(model.sanityId, payload.sanityId),
  });

  const values = {
    name: payload.name ?? null,
    shortName: payload.shortName ?? null,
    abbreviation: payload.abbreviation ?? null,
    nickname: payload.nickname ?? null,
    image: payload.image ?? null,
    top25Eligible: payload.top25Eligible ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(schoolsTable)
      .set(values)
      .where(eq(schoolsTable.id, existing.id));
    return { action: "updated" as const, id: existing.id };
  }

  const [inserted] = await db
    .insert(schoolsTable)
    .values({
      sanityId: payload.sanityId,
      ...values,
    })
    .returning({ id: schoolsTable.id });

  return { action: "inserted" as const, id: inserted!.id };
}
