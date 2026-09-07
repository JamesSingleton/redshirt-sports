import { rankingsInvalidationTags } from "@redshirt-sports/db/rankings-cache-tags";
import {
  parseCalendarWeekKey,
  seasonTypeAndNumberToLegacyWeek,
} from "@redshirt-sports/db/utils/week-mapping";

import { PUBLIC_SITE_URL } from "@/lib/site";

/**
 * Expire public web `"use cache"` rankings entries after publish/unpublish.
 * Soft-skips when secret is unset (local admin without web revalidate config).
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
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "SANITY_REVALIDATE_SECRET unset; skipping web rankings cache revalidation",
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
  const tags = rankingsInvalidationTags({ sport, division, year, week });
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? PUBLIC_SITE_URL;

  try {
    const res = await fetch(`${baseUrl}/api/revalidate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, tags }),
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
