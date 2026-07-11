"use server";

import { primaryDb as db } from "@redshirt-sports/db/client";
import {
  playersTable,
  schoolsTable,
  transferPortalEntriesTable,
} from "@redshirt-sports/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export const PORTAL_STATUSES = [
  "ENTERED",
  "COMMITTED",
  "SIGNED",
  "ENROLLED",
  "WITHDRAWN",
] as const;

export type PortalStatus = (typeof PORTAL_STATUSES)[number];

export type PortalEntryInput = {
  playerId: string;
  status: PortalStatus;
  portalYear: number;
  fromSchoolId: string;
  toSchoolId?: string | null;
  eventDate?: Date | string | null;
  enteredAt?: Date | string | null;
  committedAt?: Date | string | null;
  signedAt?: Date | string | null;
  enrolledAt?: Date | string | null;
  withdrawnAt?: Date | string | null;
  classRank?: string | null;
  isShortTermSignee?: boolean;
  isWithdrawnTransfer?: boolean;
  sortOrder?: number | null;
  /** When true (default), sync player committedSchoolId/currentStatus on COMMITTED. */
  syncPlayerOnCommit?: boolean;
};

const fromSchool = alias(schoolsTable, "from_school");
const toSchool = alias(schoolsTable, "to_school");

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

function assertPortalStatus(status: string): asserts status is PortalStatus {
  if (!PORTAL_STATUSES.includes(status as PortalStatus)) {
    throw new Error(`Invalid portal status: ${status}`);
  }
}

function normalizePortalEntryInput(data: PortalEntryInput) {
  const playerId = data.playerId.trim();
  const fromSchoolId = data.fromSchoolId.trim();
  assertPortalStatus(data.status);

  if (!playerId) throw new Error("Player is required");
  if (!fromSchoolId) throw new Error("From school is required");
  if (!Number.isFinite(data.portalYear)) {
    throw new Error("Portal year is required");
  }

  const now = new Date();
  let eventDate = parseDate(data.eventDate);
  if (!eventDate && data.status === "ENTERED") {
    eventDate = now;
  }
  if (!eventDate) {
    eventDate = now;
  }

  return {
    playerId,
    status: data.status,
    portalYear: data.portalYear,
    fromSchoolId,
    toSchoolId: emptyToNull(data.toSchoolId),
    eventDate,
    enteredAt: parseDate(data.enteredAt),
    committedAt: parseDate(data.committedAt),
    signedAt: parseDate(data.signedAt),
    enrolledAt: parseDate(data.enrolledAt),
    withdrawnAt: parseDate(data.withdrawnAt),
    classRank: emptyToNull(data.classRank),
    isShortTermSignee: data.isShortTermSignee ?? false,
    isWithdrawnTransfer: data.isWithdrawnTransfer ?? false,
    sortOrder:
      data.sortOrder == null || Number.isNaN(data.sortOrder)
        ? null
        : data.sortOrder,
    syncPlayerOnCommit: data.syncPlayerOnCommit !== false,
  };
}

async function maybeSyncPlayerOnCommit(values: {
  playerId: string;
  status: PortalStatus;
  toSchoolId: string | null;
  syncPlayerOnCommit: boolean;
}) {
  if (
    !values.syncPlayerOnCommit ||
    values.status !== "COMMITTED" ||
    !values.toSchoolId
  ) {
    return;
  }

  await db
    .update(playersTable)
    .set({
      committedSchoolId: values.toSchoolId,
      currentStatus: "COMMITTED",
      updatedAt: new Date(),
    })
    .where(eq(playersTable.id, values.playerId));
}

export async function listPortalEntriesAction({
  portalYear,
  status,
  search,
  limit = 100,
}: {
  portalYear: number;
  status?: PortalStatus | "all";
  search?: string;
  limit?: number;
}) {
  await requireAdmin();

  const conditions = [eq(transferPortalEntriesTable.portalYear, portalYear)];

  if (status && status !== "all") {
    assertPortalStatus(status);
    conditions.push(eq(transferPortalEntriesTable.status, status));
  }

  if (search?.trim()) {
    const query = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(playersTable.firstName, query),
        ilike(playersTable.lastName, query),
        ilike(playersTable.displayName, query),
        ilike(playersTable.slug, query),
      )!,
    );
  }

  return db
    .select({
      id: transferPortalEntriesTable.id,
      playerId: transferPortalEntriesTable.playerId,
      status: transferPortalEntriesTable.status,
      portalYear: transferPortalEntriesTable.portalYear,
      fromSchoolId: transferPortalEntriesTable.fromSchoolId,
      toSchoolId: transferPortalEntriesTable.toSchoolId,
      eventDate: transferPortalEntriesTable.eventDate,
      enteredAt: transferPortalEntriesTable.enteredAt,
      committedAt: transferPortalEntriesTable.committedAt,
      signedAt: transferPortalEntriesTable.signedAt,
      enrolledAt: transferPortalEntriesTable.enrolledAt,
      withdrawnAt: transferPortalEntriesTable.withdrawnAt,
      classRank: transferPortalEntriesTable.classRank,
      isShortTermSignee: transferPortalEntriesTable.isShortTermSignee,
      isWithdrawnTransfer: transferPortalEntriesTable.isWithdrawnTransfer,
      sortOrder: transferPortalEntriesTable.sortOrder,
      playerFirstName: playersTable.firstName,
      playerLastName: playersTable.lastName,
      playerDisplayName: playersTable.displayName,
      playerSlug: playersTable.slug,
      playerPosition: playersTable.position,
      fromSchoolName: fromSchool.name,
      fromSchoolShortName: fromSchool.shortName,
      toSchoolName: toSchool.name,
      toSchoolShortName: toSchool.shortName,
    })
    .from(transferPortalEntriesTable)
    .innerJoin(
      playersTable,
      eq(transferPortalEntriesTable.playerId, playersTable.id),
    )
    .innerJoin(
      fromSchool,
      eq(transferPortalEntriesTable.fromSchoolId, fromSchool.id),
    )
    .leftJoin(toSchool, eq(transferPortalEntriesTable.toSchoolId, toSchool.id))
    .where(and(...conditions))
    .orderBy(
      desc(transferPortalEntriesTable.eventDate),
      desc(transferPortalEntriesTable.id),
    )
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function createPortalEntryAction(data: PortalEntryInput) {
  await requireAdmin();
  const { syncPlayerOnCommit, ...values } = normalizePortalEntryInput(data);

  const [entry] = await db
    .insert(transferPortalEntriesTable)
    .values(values)
    .returning();

  await maybeSyncPlayerOnCommit({
    playerId: values.playerId,
    status: values.status,
    toSchoolId: values.toSchoolId,
    syncPlayerOnCommit,
  });

  revalidatePath("/transfer-portal");
  return entry;
}

export async function updatePortalEntryAction(
  id: string,
  data: PortalEntryInput,
) {
  await requireAdmin();
  const { syncPlayerOnCommit, ...values } = normalizePortalEntryInput(data);

  const [entry] = await db
    .update(transferPortalEntriesTable)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(transferPortalEntriesTable.id, id))
    .returning();

  if (!entry) {
    throw new Error("Portal entry not found");
  }

  await maybeSyncPlayerOnCommit({
    playerId: values.playerId,
    status: values.status,
    toSchoolId: values.toSchoolId,
    syncPlayerOnCommit,
  });

  revalidatePath("/transfer-portal");
  return entry;
}

export async function deletePortalEntryAction(id: string) {
  await requireAdmin();

  const [entry] = await db
    .delete(transferPortalEntriesTable)
    .where(eq(transferPortalEntriesTable.id, id))
    .returning({ id: transferPortalEntriesTable.id });

  if (!entry) {
    throw new Error("Portal entry not found");
  }

  revalidatePath("/transfer-portal");
  return { success: true as const };
}
