import { at, defineMigration, set, setIfMissing } from "sanity/migrate";

import { LIMITS } from "../../house-rules/limits";
import { normalizeWhitespace, truncateAtWord } from "../../house-rules/text";

/**
 * Two fixes that can be derived from the headline alone:
 *
 * - trims stray whitespace from headlines
 * - gives an article whose headline is longer than 60 characters an SEO title,
 *   cut from the headline on a word boundary
 *
 * A cut headline is a floor, not a good SEO title. The articles it touches are
 * worth a human pass, newest first.
 */
export default defineMigration({
  title: "Clean headlines and backfill SEO titles",
  documentTypes: ["post"],
  filter: "defined(title)",
  migrate: {
    document(doc) {
      const title = doc.title as string | undefined;
      if (!title) return [];
      const patches = [];
      const clean = normalizeWhitespace(title);
      if (clean !== title) patches.push(at("title", set(clean)));
      if (!doc.seoTitle && clean.length > LIMITS.seoTitle.max) {
        patches.push(
          at(
            "seoTitle",
            setIfMissing(truncateAtWord(clean, LIMITS.seoTitle.max)),
          ),
        );
      }
      return patches;
    },
  },
});
