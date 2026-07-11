"use server";

import {
  type FinalizeRankingsResult,
  finalizeWeeklyRankings,
} from "@redshirt-sports/db/finalize-rankings";
import {
  getBallotStatusForWeek,
  getSportIdBySlug,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/require-admin";

export type RankingsActionParams = {
  sportSlug: SportParam;
  division: string;
  year: number;
  week: number;
};

async function resolveSportId(sportSlug: SportParam): Promise<string> {
  const sportId = await getSportIdBySlug(sportSlug);
  if (!sportId) {
    throw new Error(`Sport not found for slug: ${sportSlug}`);
  }
  return sportId;
}

export async function previewFinalizeRankings(
  params: RankingsActionParams,
): Promise<FinalizeRankingsResult> {
  await requireAdmin();
  const sportId = await resolveSportId(params.sportSlug);

  return finalizeWeeklyRankings({
    sportId,
    division: params.division,
    year: params.year,
    week: params.week,
    dryRun: true,
  });
}

export async function finalizeRankings(
  params: RankingsActionParams,
): Promise<FinalizeRankingsResult & { revalidationNote: string }> {
  await requireAdmin();
  const sportId = await resolveSportId(params.sportSlug);

  const result = await finalizeWeeklyRankings({
    sportId,
    division: params.division,
    year: params.year,
    week: params.week,
    dryRun: false,
  });

  revalidatePath("/rankings");

  // Attempt web app path revalidation. revalidatePath only affects this
  // Next.js app, so these calls are best-effort / no-ops for the web app.
  const webPaths = [
    `/college/${params.sportSlug}/rankings/${params.division}/${params.year}/${params.week}`,
    `/college/${params.sportSlug}/rankings/${params.division}`,
    `/college/${params.sportSlug}/rankings`,
  ];
  for (const path of webPaths) {
    revalidatePath(path);
  }

  return {
    ...result,
    revalidationNote:
      "Called revalidatePath for admin and web rankings paths. Cross-app revalidation may not apply; use the web revalidate-tags API if the public site cache does not update.",
  };
}

export async function getBallotStatusAction(params: RankingsActionParams) {
  await requireAdmin();
  const sportId = await resolveSportId(params.sportSlug);

  return getBallotStatusForWeek({
    sportId,
    division: params.division,
    year: params.year,
    week: params.week,
  });
}
