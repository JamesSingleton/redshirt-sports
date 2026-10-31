import { SITE_BRAND } from "@/lib/seo";

/** Google typically displays ~150–160 characters in SERP snippets. */
export const META_DESCRIPTION_MAX_LENGTH = 160;

export function getBrandName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? SITE_BRAND;
}

/**
 * Normalize whitespace and trim to max length at a word boundary.
 */
export function trimMetaDescription(
  text: string,
  max = META_DESCRIPTION_MAX_LENGTH,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }

  const slice = normalized.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed =
    lastSpace > Math.floor(max * 0.55)
      ? slice.slice(0, lastSpace)
      : slice.slice(0, max - 1);

  return `${trimmed.trimEnd()}…`;
}
