import { env } from "@/env";
import { resolvePublicSiteUrl } from "@/lib/site";

/**
 * Expire a portal push's cache tags on the public site.
 *
 * Unlike the rankings helpers this throws on any failure, missing secret
 * included: `expirePendingPortalPushes` records the failure and the push stays
 * unconfirmed, so the nightly cron on the web app expires it instead.
 */
export async function expireWebPortalTags(tags: string[]) {
  if (tags.length === 0) return;
  const secret = env.CACHE_REVALIDATE_SECRET;
  if (!secret) {
    throw new Error(
      "CACHE_REVALIDATE_SECRET is not set; the nightly job will refresh the site.",
    );
  }
  const baseUrl = resolvePublicSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  const res = await fetch(`${baseUrl}/api/revalidate-tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, cacheTags: tags }),
  });
  if (!res.ok) {
    throw new Error(
      `Site cache refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`,
    );
  }
}
