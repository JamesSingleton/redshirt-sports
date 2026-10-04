import { PORTAL_CACHE_TAG } from "@redshirt-sports/db/transfer-portal-cache-tags";

import { env } from "@/env";
import { resolvePublicSiteUrl } from "@/lib/site";

/**
 * Expire every public transfer portal `"use cache"` entry after an admin
 * write. Each portal cache scope carries the base tag, and edits are rare,
 * so one broad tag beats tracking every affected player, school, and wire.
 * Soft-skips when CACHE_REVALIDATE_SECRET is unset.
 */
export async function revalidateWebPortalCache() {
  const secret = env.CACHE_REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "CACHE_REVALIDATE_SECRET unset; skipping web transfer portal cache revalidation",
    );
    return;
  }

  const baseUrl = resolvePublicSiteUrl(env.NEXT_PUBLIC_SITE_URL);

  try {
    const res = await fetch(`${baseUrl}/api/revalidate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, cacheTags: [PORTAL_CACHE_TAG] }),
    });
    if (!res.ok) {
      console.error(
        `Web transfer portal cache revalidation failed (${res.status})`,
        await res.text(),
      );
    }
  } catch (error) {
    console.error(
      "Web transfer portal cache revalidation request failed",
      error,
    );
  }
}
