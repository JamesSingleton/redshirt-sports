"use server";

import {
  createPlayer,
  createPortalEntry,
  deletePlayer,
  deletePortalEntry,
  getPlayerForAdmin,
  listPlayersForAdmin,
  listPortalEntriesForAdmin,
  listSchoolOptions,
  listSportOptions,
  updatePlayer,
  updatePortalEntry,
} from "@redshirt-sports/db/queries";
import { ACADEMIC_YEARS, PORTAL_STATUSES } from "@redshirt-sports/db/schema";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/require-admin";
import { revalidateWebPortalCache } from "@/lib/revalidate-web-portal";

const ADMIN_PAGE = "/transfer-portal";

function afterPortalWrite() {
  revalidatePath(ADMIN_PAGE);
  after(revalidateWebPortalCache);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((value) => value || null)
  .nullish();

const optionalInt = (max: number) => z.number().int().min(1).max(max).nullish();

/** `YYYY-MM-DD` from a date input, stored as midnight UTC. */
const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => new Date(`${value}T00:00:00Z`));

const optionalDate = z
  .union([dateInput, z.literal("")])
  .nullish()
  .transform((value) => (value instanceof Date ? value : null));

const playerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  slug: z.string().trim().max(200).optional(),
  position: z.string().trim().min(1).max(10).toUpperCase(),
  sportId: z.string().min(1),
  academicYear: z.enum(ACADEMIC_YEARS).nullish(),
  isRedshirt: z.boolean().default(false),
  heightInches: optionalInt(108),
  weightLbs: optionalInt(500),
  hometown: optionalText,
});

export type PlayerFormInput = z.input<typeof playerSchema>;

const entrySchema = z.object({
  playerId: z.string().min(1),
  portalYear: z.number().int().min(2000).max(2100),
  status: z.enum(PORTAL_STATUSES),
  fromSchoolId: z.string().min(1),
  toSchoolId: z
    .string()
    .nullish()
    .transform((value) => value || null),
  enteredAt: dateInput,
  committedAt: optionalDate,
  signedAt: optionalDate,
  enrolledAt: optionalDate,
  withdrawnAt: optionalDate,
});

export type PortalEntryFormInput = z.input<typeof entrySchema>;

type ActionResult = { ok: true } | { ok: false; error: string };

function failure(error: unknown): ActionResult {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return {
      ok: false,
      error: issue
        ? `${issue.path.join(".") || "Input"}: ${issue.message}`
        : "Invalid input",
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("unique") || message.includes("duplicate")) {
    return {
      ok: false,
      error:
        "That record already exists. Players need a unique slug and one portal entry per year.",
    };
  }
  console.error("Transfer portal admin write failed", error);
  return { ok: false, error: "Something went wrong. Try again." };
}

export async function getTransferPortalAdminData({
  search,
}: {
  search?: string;
}) {
  await requireAdmin();
  const [players, entries, schools, sports] = await Promise.all([
    listPlayersForAdmin({ search, limit: 100 }),
    listPortalEntriesForAdmin({ limit: 100 }),
    listSchoolOptions(),
    listSportOptions(),
  ]);
  return { players, entries, schools, sports };
}

export async function savePlayerAction(
  id: string | null,
  input: PlayerFormInput,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { slug, ...data } = playerSchema.parse(input);
    const values = {
      ...data,
      academicYear: data.academicYear ?? null,
      heightInches: data.heightInches ?? null,
      weightLbs: data.weightLbs ?? null,
      hometown: data.hometown ?? null,
      slug: slugify(slug || `${data.firstName} ${data.lastName}`),
    };
    if (!values.slug) throw new Error("Slug could not be generated");

    if (id) {
      const updated = await updatePlayer(id, values);
      if (!updated) return { ok: false, error: "Player not found" };
    } else {
      await createPlayer(values);
    }
    afterPortalWrite();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePlayerAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await deletePlayer(id);
    if (!deleted) return { ok: false, error: "Player not found" };
    afterPortalWrite();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function savePortalEntryAction(
  id: string | null,
  input: PortalEntryFormInput,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { playerId, ...data } = entrySchema.parse(input);
    const player = await getPlayerForAdmin(playerId);
    if (!player) return { ok: false, error: "Player not found" };

    const values = { ...data, playerId, sportId: player.sportId };
    if (id) {
      const updated = await updatePortalEntry(id, values);
      if (!updated) return { ok: false, error: "Portal entry not found" };
    } else {
      await createPortalEntry(values);
    }
    afterPortalWrite();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePortalEntryAction(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await deletePortalEntry(id);
    if (!deleted) return { ok: false, error: "Portal entry not found" };
    afterPortalWrite();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
