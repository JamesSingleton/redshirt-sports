import { RANKINGS_CACHE_TAG } from "@redshirt-sports/db/rankings-cache-tags";
import { revalidateTag } from "next/cache";
import { after } from "next/server";

export type RankingsVoterDisplay = {
  firstName: string;
  lastName: string;
  organization?: string | null;
  organizationRole?: string | null;
};

export function rankingsVoterDisplayChanged(
  current: RankingsVoterDisplay | undefined,
  next: RankingsVoterDisplay,
): boolean {
  if (!current) return false;
  return (
    current.firstName !== next.firstName ||
    current.lastName !== next.lastName ||
    (current.organization ?? null) !== (next.organization ?? null) ||
    (current.organizationRole ?? null) !== (next.organizationRole ?? null)
  );
}

/** Expire public rankings `"use cache"` entries after a display-field write. */
export function expireRankingsCache() {
  after(() => {
    revalidateTag(RANKINGS_CACHE_TAG, { expire: 0 });
  });
}
