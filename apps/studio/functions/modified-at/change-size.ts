/** Fewer changed words than this is a typo fix, not an update. */
export const MIN_CHANGED_WORDS = 10;

/** Edits this soon after publishing are part of getting the story out. */
export const GRACE_PERIOD_MS = 60 * 60 * 1000;

function wordCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) ?? []) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

/**
 * Words added plus words removed between two versions of a story's text,
 * ignoring order. Replacing one word counts as two (one out, one in), so a
 * typo fix scores 2 and a new sentence about a coaching hire scores 10+.
 */
export function countChangedWords(before: string, after: string): number {
  const beforeCounts = wordCounts(before);
  const afterCounts = wordCounts(after);
  let changed = 0;
  for (const word of new Set([...beforeCounts.keys(), ...afterCounts.keys()])) {
    changed += Math.abs(
      (beforeCounts.get(word) ?? 0) - (afterCounts.get(word) ?? 0),
    );
  }
  return changed;
}

export type ModifiedAtDecision =
  | { update: true; reason: string }
  | { update: false; reason: string };

/** Whether a published edit counts as a substantive update to the story. */
export function decideModifiedAt({
  publishedAt,
  titleChanged,
  beforeText,
  afterText,
  now = new Date(),
}: {
  publishedAt?: string | null;
  titleChanged?: boolean | null;
  beforeText?: string | null;
  afterText?: string | null;
  now?: Date;
}): ModifiedAtDecision {
  if (!publishedAt) {
    return { update: false, reason: "not published yet" };
  }
  if (now.getTime() - new Date(publishedAt).getTime() < GRACE_PERIOD_MS) {
    return { update: false, reason: "within an hour of publishing" };
  }
  if (titleChanged) {
    return { update: true, reason: "title changed" };
  }
  const changedWords = countChangedWords(beforeText ?? "", afterText ?? "");
  if (changedWords >= MIN_CHANGED_WORDS) {
    return { update: true, reason: `${changedWords} words changed` };
  }
  return {
    update: false,
    reason: `only ${changedWords} words changed (minor edit)`,
  };
}
