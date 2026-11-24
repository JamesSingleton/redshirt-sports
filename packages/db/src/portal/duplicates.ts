/**
 * How sure we are that a similar name on file is the player being entered.
 *
 * Measured on 20,000 players with real college name frequencies, 400 known
 * re-entries (typos, missing suffix, nicknames, initials) and 400 new players
 * (docs/portal-baselines.md, Phase 3). Listing every trigram match made the
 * editor confirm "a different person" on every new player; these tiers keep
 * 386 of 400 re-entries "likely" and block 33% of new players, and the rest of
 * the re-entries still show as "possible".
 */

export type DuplicateTier = "likely" | "possible";

/** What the editor has entered so far, to tell namesakes apart. */
export interface DuplicateContext {
  sportId?: string | null;
  schoolId?: string | null;
  hsGradYear?: number | null;
}

export interface DuplicateFacts {
  /** Trigram similarity of the names, 0 to 1. */
  similarity: number;
  sportIds: string[];
  currentSchoolIds: string[];
  hsGradYear: number | null;
}

/** Name close enough to show with nothing else in common. */
const SHOW_ALONE = 0.5;
/** Name close enough to show when sport and school or class agree. */
const SHOW_WITH_CONTEXT = 0.3;
/** Name close enough to stop the save on its own. */
const LIKELY_ALONE = 0.8;
/** Name close enough to stop the save when sport and school or class agree. */
const LIKELY_WITH_CONTEXT = 0.5;

function sharesContext(match: DuplicateFacts, context: DuplicateContext) {
  if (!context.sportId || !match.sportIds.includes(context.sportId)) {
    return false;
  }
  const sameSchool =
    !!context.schoolId && match.currentSchoolIds.includes(context.schoolId);
  const sameClass =
    !!context.hsGradYear && match.hsGradYear === context.hsGradYear;
  return sameSchool || sameClass;
}

/** "likely" stops the save until confirmed; "possible" is shown only; null is hidden. */
export function duplicateTier(
  match: DuplicateFacts,
  context: DuplicateContext,
): DuplicateTier | null {
  const shared = sharesContext(match, context);
  if (
    match.similarity >= LIKELY_ALONE ||
    (shared && match.similarity >= LIKELY_WITH_CONTEXT)
  ) {
    return "likely";
  }
  if (
    match.similarity >= SHOW_ALONE ||
    (shared && match.similarity >= SHOW_WITH_CONTEXT)
  ) {
    return "possible";
  }
  return null;
}

/** Likely matches first, then by name similarity; hidden ones dropped. */
export function rankDuplicates<T extends DuplicateFacts>(
  matches: T[],
  context: DuplicateContext,
  limit = 8,
): Array<T & { tier: DuplicateTier }> {
  return matches
    .flatMap((match) => {
      const tier = duplicateTier(match, context);
      return tier ? [{ ...match, tier }] : [];
    })
    .sort(
      (a, b) =>
        Number(b.tier === "likely") - Number(a.tier === "likely") ||
        b.similarity - a.similarity,
    )
    .slice(0, limit);
}
