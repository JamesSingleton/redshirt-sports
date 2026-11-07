import { ratingsInvalidationTags } from "@redshirt-sports/db/ratings/cache-tags";

import { env } from "@/env";
import { resolvePublicSiteUrl } from "@/lib/site";

/**
 * Expire the public ratings pages for a pool after publish, unpublish, or rollback.
 * Same `/api/revalidate-tags` path as rankings. Soft-skips when CACHE_REVALIDATE_SECRET is unset.
 */
export async function revalidateWebRatingsCache(
  sport: string,
  pool: string,
  options?: { visibilityChanged?: boolean },
) {
  const secret = env.CACHE_REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "CACHE_REVALIDATE_SECRET unset; skipping web ratings cache revalidation",
    );
    return;
  }
  const baseUrl = resolvePublicSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  try {
    const res = await fetch(`${baseUrl}/api/revalidate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        cacheTags: ratingsInvalidationTags(sport, pool, options),
      }),
    });
    if (!res.ok) {
      console.error(
        `Web ratings cache revalidation failed (${res.status})`,
        await res.text(),
      );
    }
  } catch (error) {
    console.error("Web ratings cache revalidation request failed", error);
  }
}
