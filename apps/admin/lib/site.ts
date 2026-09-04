/**
 * Public site origin for admin links and outbound references.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to Vercel production URL.
 */
function resolvePublicSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!configured) {
    return "http://localhost:3000";
  }

  return configured.startsWith("http") ? configured : `https://${configured}`;
}

export const PUBLIC_SITE_URL = resolvePublicSiteUrl();

export function publicSiteLabel(): string {
  try {
    return new URL(PUBLIC_SITE_URL).hostname.replace(/^www\./, "");
  } catch {
    return PUBLIC_SITE_URL;
  }
}
