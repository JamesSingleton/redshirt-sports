import { STORY_SLUG_PATTERN } from "./constants";

const SLUG = new RegExp(STORY_SLUG_PATTERN);

/**
 * The article slug in what an editor pasted: a bare slug
 * (`portal-qb-visits-idaho`) or the article's URL on the site. Null for
 * blank; undefined when it's neither, so the form can say so.
 */
export function parseStorySlug(
  input: string | null | undefined,
): string | null | undefined {
  const text = input?.trim();
  if (!text) return null;
  let candidate = text;
  if (/^https?:\/\//i.test(text)) {
    try {
      candidate = new URL(text).pathname;
    } catch {
      return undefined;
    }
  }
  // Articles live at the site root: `/slug`, with or without slashes.
  candidate = candidate.replace(/^\/+|\/+$/g, "");
  return candidate.length <= 200 && SLUG.test(candidate)
    ? candidate
    : undefined;
}
