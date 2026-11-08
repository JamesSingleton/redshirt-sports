"use server";

import {
  applyTeamIdMappings,
  planUnmappedSchools,
  previewTeam,
  unmappedSchools,
} from "@redshirt-sports/db/ratings";
import { revalidatePath } from "next/cache";

import type { RatingsActionResult } from "@/actions/ratings";
import { requireAdmin } from "@/lib/require-admin";
import { teamCatalog } from "@/lib/team-catalog";

/** Schools with no team id, each with suggested teams, plus overall coverage. */
export async function getSchoolIdReview() {
  await requireAdmin();
  return unmappedSchools(await teamCatalog());
}

export type SchoolIdReview = Awaited<ReturnType<typeof getSchoolIdReview>>;

/** Save every confident match (mutual best, same mascot, clear margin). Never overwrites. */
export async function saveConfidentTeamIds(): Promise<RatingsActionResult> {
  await requireAdmin();
  try {
    const plan = await planUnmappedSchools(await teamCatalog());
    const { inserted, skipped } = await applyTeamIdMappings(plan.accepted);
    revalidatePath("/school-ids");
    return {
      ok: true,
      message: `Saved ${inserted.length} team id(s).`,
      lines: skipped.map(
        (mapping) =>
          `Skipped ${mapping.schoolName} → ${mapping.teamName}: mapped in the meantime.`,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Saving failed.",
      lines: [],
    };
  }
}

/** The provider team behind an id an admin typed, so they can check it before saving. */
export async function lookUpTeam(externalId: string) {
  await requireAdmin();
  return previewTeam(externalId.trim());
}
