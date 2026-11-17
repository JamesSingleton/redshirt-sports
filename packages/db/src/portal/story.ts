import { STORY_SLUG_PATTERN } from "./constants";

const SLUG = new RegExp(STORY_SLUG_PATTERN);
/** Longer than any article URL we'd paste. Checked before any parsing. */
const MAX_INPUT = 500;
const MAX_SLUG = 200;

/** Drop leading and trailing slashes. A loop, not a regex: linear on any input. */
function trimSlashes(path: string) {
  let start = 0;
  let end = path.length;
  while (start < end && path[start] === "/") start++;
  while (end > start && path[end - 1] === "/") end--;
  return path.slice(start, end);
}

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
  if (text.length > MAX_INPUT) return undefined;
  let candidate = text;
  if (/^https?:\/\//i.test(text)) {
    try {
      candidate = new URL(text).pathname;
    } catch {
      return undefined;
    }
  }
  // Articles live at the site root: `/slug`, with or without slashes.
  candidate = trimSlashes(candidate);
  return candidate.length <= MAX_SLUG && SLUG.test(candidate)
    ? candidate
    : undefined;
}
