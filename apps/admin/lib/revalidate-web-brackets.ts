import { bracketInvalidationTags } from "@redshirt-sports/db/playoff-bracket/cache-tags";

import { env } from "@/env";
import { resolvePublicSiteUrl } from "@/lib/site";

/**
 * Expire the public bracket pages and article embeds for one edition.
 * Same `/api/revalidate-tags` path as rankings. Soft-skips when CACHE_REVALIDATE_SECRET is unset.
 */
export async function revalidateWebBracketsCache(
  edition: Parameters<typeof bracketInvalidationTags>[0],
) {
  const secret = env.CACHE_REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "CACHE_REVALIDATE_SECRET unset; skipping web bracket cache revalidation",
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
        cacheTags: bracketInvalidationTags(edition),
      }),
    });
    if (!res.ok) {
      console.error(
        `Web bracket cache revalidation failed (${res.status})`,
        await res.text(),
      );
    }
  } catch (error) {
    console.error("Web bracket cache revalidation request failed", error);
  }
}
