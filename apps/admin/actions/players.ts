"use server";

import { primaryDb as db } from "@redshirt-sports/db/client";
import {
  playersTable,
  schoolsTable,
  sportsTable,
} from "@redshirt-sports/db/schema";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export type PlayerInput = {
  firstName: string;
  lastName: string;
  displayName?: string | null;
  slug?: string | null;
  sportId?: string | null;
  position?: string | null;
  classYear?: number | null;
  heightInches?: number | null;
  weightLbs?: number | null;
  headshotUrl?: string | null;
  hometown?: string | null;
  highSchool?: string | null;
  bio?: string | null;
  currentStatus?: string | null;
  lastSchoolId?: string | null;
  committedSchoolId?: string | null;
};

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugifyName(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePlayerInput(data: PlayerInput) {
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }

  const slug = emptyToNull(data.slug) ?? slugifyName(firstName, lastName);

  if (!slug) {
    throw new Error("Could not generate a valid slug");
  }

  return {
    firstName,
    lastName,
    displayName: emptyToNull(data.displayName),
    slug,
    sportId: emptyToNull(data.sportId),
    position: emptyToNull(data.position),
    classYear:
      data.classYear == null || Number.isNaN(data.classYear)
        ? null
        : data.classYear,
    heightInches:
      data.heightInches == null || Number.isNaN(data.heightInches)
        ? null
        : data.heightInches,
    weightLbs:
      data.weightLbs == null || Number.isNaN(data.weightLbs)
        ? null
        : data.weightLbs,
    headshotUrl: emptyToNull(data.headshotUrl),
    hometown: emptyToNull(data.hometown),
    highSchool: emptyToNull(data.highSchool),
    bio: emptyToNull(data.bio),
    currentStatus: emptyToNull(data.currentStatus),
    lastSchoolId: emptyToNull(data.lastSchoolId),
    committedSchoolId: emptyToNull(data.committedSchoolId),
  };
}

export async function listPlayersAction({
  search,
  limit = 50,
}: {
  search?: string;
  limit?: number;
} = {}) {
  await requireAdmin();

  const conditions = [];
  if (search?.trim()) {
    const query = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(playersTable.firstName, query),
        ilike(playersTable.lastName, query),
        ilike(playersTable.displayName, query),
        ilike(playersTable.slug, query),
        sql`concat(${playersTable.firstName}, ' ', ${playersTable.lastName}) ilike ${query}`,
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
      sportId: playersTable.sportId,
      position: playersTable.position,
      classYear: playersTable.classYear,
      heightInches: playersTable.heightInches,
      weightLbs: playersTable.weightLbs,
      headshotUrl: playersTable.headshotUrl,
      hometown: playersTable.hometown,
      highSchool: playersTable.highSchool,
      bio: playersTable.bio,
      currentStatus: playersTable.currentStatus,
      lastSchoolId: playersTable.lastSchoolId,
      committedSchoolId: playersTable.committedSchoolId,
      sportName: sportsTable.displayName,
      sportSlug: sportsTable.slug,
      lastSchoolName: schoolsTable.name,
    })
    .from(playersTable)
    .leftJoin(sportsTable, eq(playersTable.sportId, sportsTable.id))
    .leftJoin(schoolsTable, eq(playersTable.lastSchoolId, schoolsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(playersTable.lastName), asc(playersTable.firstName))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function getPlayerAction(id: string) {
  await requireAdmin();

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, id))
    .limit(1);

  return player ?? null;
}

export async function createPlayerAction(data: PlayerInput) {
  await requireAdmin();
  const values = normalizePlayerInput(data);

  const [player] = await db.insert(playersTable).values(values).returning();

  revalidatePath("/players");
  return player;
}

export async function updatePlayerAction(id: string, data: PlayerInput) {
  await requireAdmin();
  const values = normalizePlayerInput(data);

  const [player] = await db
    .update(playersTable)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(playersTable.id, id))
    .returning();

  if (!player) {
    throw new Error("Player not found");
  }

  revalidatePath("/players");
  return player;
}

export async function deletePlayerAction(id: string) {
  await requireAdmin();

  const [player] = await db
    .delete(playersTable)
    .where(eq(playersTable.id, id))
    .returning({ id: playersTable.id });

  if (!player) {
    throw new Error("Player not found");
  }

  revalidatePath("/players");
  return { success: true as const };
}

export async function listSportsForSelect() {
  await requireAdmin();

  const sports = await db
    .select({
      id: sportsTable.id,
      slug: sportsTable.slug,
      name: sportsTable.name,
      displayName: sportsTable.displayName,
    })
    .from(sportsTable)
    .orderBy(asc(sportsTable.name));

  return sports;
}

export async function listSchoolsForSelect({
  search,
}: {
  search?: string;
} = {}) {
  await requireAdmin();

  const conditions = [];
  if (search?.trim()) {
    const query = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(schoolsTable.name, query),
        ilike(schoolsTable.shortName, query),
        ilike(schoolsTable.abbreviation, query),
      )!,
    );
  }

  return db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
    })
    .from(schoolsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(schoolsTable.name))
    .limit(50);
}
