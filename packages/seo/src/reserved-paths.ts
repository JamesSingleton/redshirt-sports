/**
 * Root segments a page-builder slug must not take.
 * `/college` is reserved and has no page. `/high-school` is reserved until it is designed.
 */
export const RESERVED_ROOT_SEGMENTS = [
  "college",
  "high-school",
  "teams",
  "people",
  "transfer-portal",
  "topics",
  "podcasts",
  "video",
  "bracket-challenge",
  "newsletters",
  "onboarding",
  "account",
  "search",
  "sign-in",
  "sign-up",
  "api",
  "studio",
  "sitemap.xml",
  "news-sitemap.xml",
  "sitemaps",
  "robots.txt",
  "feed.xml",
  "ads.txt",
  "manifest.webmanifest",
  "_next",
] as const;

export function reservedRootSegment(slug: string): string | null {
  const root = slug.replace(/^\/+/, "").split("/")[0] ?? "";
  return (RESERVED_ROOT_SEGMENTS as readonly string[]).includes(root)
    ? root
    : null;
}
