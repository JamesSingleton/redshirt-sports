import type { SchoolRankingsDisplay } from "@redshirt-sports/db/queries";
import { RANKINGS_CACHE_TAG } from "@redshirt-sports/db/rankings-cache-tags";
import { revalidateTag } from "next/cache";
import { after } from "next/server";

export type RankingsVoterDisplay = {
  firstName: string;
  lastName: string;
  organization?: string | null;
  organizationRole?: string | null;
};

function schoolLogoFingerprint(image: unknown): string {
  if (image == null) return "";
  try {
    return JSON.stringify(image);
  } catch {
    return String(image);
  }
}

export function schoolRankingsDisplayChanged(
  current: SchoolRankingsDisplay | null,
  next: SchoolRankingsDisplay,
): boolean {
  if (!current) {
    return next.top25Eligible === true;
  }

  return (
    current.name !== next.name ||
    current.shortName !== next.shortName ||
    current.abbreviation !== next.abbreviation ||
    current.slug !== next.slug ||
    current.top25Eligible !== next.top25Eligible ||
    schoolLogoFingerprint(current.image) !== schoolLogoFingerprint(next.image)
  );
}

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
