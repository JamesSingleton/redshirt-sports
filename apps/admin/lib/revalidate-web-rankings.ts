import { rankingsInvalidationTags } from "@redshirt-sports/db/rankings-cache-tags";
import {
  parseCalendarWeekKey,
  seasonTypeAndNumberToLegacyWeek,
} from "@redshirt-sports/db/utils/week-mapping";

import { env } from "@/env";
import { resolvePublicSiteUrl } from "@/lib/site";

/**
 * Expire public web `"use cache"` rankings entries after publish/unpublish.
 * Hits the public site (`NEXT_PUBLIC_SITE_URL`, host-only OK) or the
 * hardcoded fallback. Soft-skips when CACHE_REVALIDATE_SECRET is unset.
 */
export async function revalidateWebRankingsCache({
  sport,
  division,
  year,
  weekKey,
}: {
  sport: string;
  division: string;
  year: number;
  weekKey: string;
}) {
  const secret = env.CACHE_REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "CACHE_REVALIDATE_SECRET unset; skipping web rankings cache revalidation",
    );
    return;
  }

  const parsed = parseCalendarWeekKey(weekKey);
  if (!parsed) {
    console.warn(`Invalid weekKey for cache revalidation: ${weekKey}`);
    return;
  }

  const week = seasonTypeAndNumberToLegacyWeek(
    parsed.seasonType,
    parsed.weekNumber,
  );
  const cacheTags = rankingsInvalidationTags({ sport, division, year, week });
  const baseUrl = resolvePublicSiteUrl(env.NEXT_PUBLIC_SITE_URL);

  try {
    const res = await fetch(`${baseUrl}/api/revalidate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, cacheTags }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(
        `Web rankings cache revalidation failed (${res.status})`,
        body,
      );
    }
  } catch (error) {
    console.error("Web rankings cache revalidation request failed", error);
  }
}
