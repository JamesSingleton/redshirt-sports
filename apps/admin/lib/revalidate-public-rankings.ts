import { env } from "@/env";
import { PUBLIC_SITE_URL } from "@/lib/site";

/** Keep in sync with `POLL_RANKINGS_CACHE_TAG` in apps/web/lib/rankings-data.ts */
export const POLL_RANKINGS_CACHE_TAG = "poll-rankings";

/**
 * Bust public web `"use cache"` entries tagged for poll rankings (navbar
 * latest week, year/week filters, rankings pages, team history).
 * Soft-fails: publish already succeeded if this errors.
 */
export async function revalidatePublicPollRankingsCache(): Promise<void> {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    console.error(
      "SANITY_REVALIDATE_SECRET is not set; skipping public poll rankings cache bust",
    );
    return;
  }

  try {
    const response = await fetch(`${PUBLIC_SITE_URL}/api/revalidate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        cacheTags: [POLL_RANKINGS_CACHE_TAG],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `Failed to revalidate public poll rankings cache (${response.status}): ${body}`,
      );
    }
  } catch (error) {
    console.error("Failed to revalidate public poll rankings cache", error);
  }
}
