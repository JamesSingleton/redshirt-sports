/** Fallback when `NEXT_PUBLIC_SITE_URL` is unset on admin. */
export const PUBLIC_SITE_URL = "https://www.redshirtsports.com";

/**
 * Absolute public web origin for server-side fetches (cache revalidation, etc.).
 * Accepts host-only values like `www.redshirtsports.xyz` from Vercel env.
 */
export function resolvePublicSiteUrl(
  configured: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const raw = configured?.trim().replace(/\/$/, "");
  if (!raw) {
    return PUBLIC_SITE_URL;
  }
  return raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;
}
