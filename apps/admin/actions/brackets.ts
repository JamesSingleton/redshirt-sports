"use server";

import { auth } from "@redshirt-sports/auth/server";
import {
  BracketInputError,
  type BracketKind,
  type BracketStatus,
  createBracketEdition,
  deleteDraftBracketEdition,
  getBracketEditionSummary,
  setBracketEditionStatus,
  setBracketGame,
  setBracketSlot,
  updateBracketEditionDetails,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { easternInputToDate } from "@/lib/bracket-season";
import { requireAdmin } from "@/lib/require-admin";
import { revalidateWebBracketsCache } from "@/lib/revalidate-web-brackets";

export type BracketActionResult = {
  ok: boolean;
  message: string;
  editionId?: string;
};

function failure(error: unknown): BracketActionResult {
  if (error instanceof BracketInputError) {
    return { ok: false, message: error.message };
  }
  console.error("Bracket action failed", error);
  return { ok: false, message: "Saving the bracket failed." };
}

/**
 * Refresh admin, and the public site when the edition is (or just stopped
 * being) published. Drafts never render publicly, so they skip the web call.
 */
async function refresh(editionId: string, publicChange?: boolean) {
  const edition = await getBracketEditionSummary(editionId);
  revalidatePath("/brackets");
  revalidatePath(`/brackets/${editionId}`);
  if (edition && (publicChange ?? edition.status === "published")) {
    after(() => revalidateWebBracketsCache(edition));
  }
}

export async function createBracketEditionAction(input: {
  formatId: string;
  seasonId: string;
  kind: BracketKind;
  weekId: string | null;
  copySlotsFrom: string | null;
}): Promise<BracketActionResult> {
  await requireAdmin();
  try {
    const editionId = await createBracketEdition(input);
    revalidatePath("/brackets");
    return { ok: true, message: "Bracket created", editionId };
  } catch (error) {
    return failure(error);
  }
}

export async function saveBracketSlotAction(input: {
  editionId: string;
  slotKey: string;
  schoolId: string | null;
  bidType: "auto" | "at-large" | null;
  bidLabel: string | null;
}): Promise<BracketActionResult> {
  await requireAdmin();
  try {
    const { swappedWith } = await setBracketSlot({
      ...input,
      bidLabel: input.bidLabel?.trim() || null,
    });
    await refresh(input.editionId);
    return {
      ok: true,
      message: swappedWith ? `Swapped with ${swappedWith}` : "Saved",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function saveBracketGameAction(input: {
  editionId: string;
  gameKey: string;
  homeSide: "a" | "b" | null;
  siteLabel: string | null;
  kickoffAt: string | null;
  sideAScore: number | null;
  sideBScore: number | null;
}): Promise<BracketActionResult> {
  await requireAdmin();
  const kickoffAt = input.kickoffAt
    ? easternInputToDate(input.kickoffAt)
    : null;
  if (input.kickoffAt && !kickoffAt) {
    return { ok: false, message: "Kickoff is not a valid date" };
  }
  try {
    await setBracketGame({
      ...input,
      siteLabel: input.siteLabel?.trim() || null,
      kickoffAt,
    });
    await refresh(input.editionId);
    return { ok: true, message: "Game saved" };
  } catch (error) {
    return failure(error);
  }
}

export async function saveBracketDetailsAction(input: {
  editionId: string;
  articleUrl: string;
  publicNote: string;
}): Promise<BracketActionResult> {
  await requireAdmin();
  try {
    await updateBracketEditionDetails({
      editionId: input.editionId,
      articleUrl: input.articleUrl.trim() || null,
      publicNote: input.publicNote.trim() || null,
    });
    await refresh(input.editionId);
    return { ok: true, message: "Details saved" };
  } catch (error) {
    return failure(error);
  }
}

export async function setBracketStatusAction(input: {
  editionId: string;
  status: BracketStatus;
}): Promise<BracketActionResult> {
  await requireAdmin();
  const { userId } = await auth();
  try {
    await setBracketEditionStatus({ ...input, userId: userId ?? null });
    await refresh(input.editionId, true);
    return {
      ok: true,
      message: input.status === "published" ? "Published" : "Unpublished",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteBracketEditionAction(
  editionId: string,
): Promise<BracketActionResult> {
  await requireAdmin();
  try {
    await deleteDraftBracketEdition(editionId);
    revalidatePath("/brackets");
    return { ok: true, message: "Draft deleted" };
  } catch (error) {
    return failure(error);
  }
}
