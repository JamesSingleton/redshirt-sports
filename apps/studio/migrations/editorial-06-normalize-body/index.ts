import { at, defineMigration, set } from "sanity/migrate";

import type { BodyBlock } from "../../house-rules/types";
import { changedBlocks, normalizeBody } from "../../utils/body-transforms";

/**
 * Brings old article bodies in line with the article template:
 *
 * - the first subheading becomes a Heading 2 and no level is skipped
 * - Heading 5 and 6 become Heading 4 (the template stops there)
 * - underline and other retired text styles are removed; the text stays
 */
export default defineMigration({
  title: "Normalize article body headings and text styles",
  documentTypes: ["post"],
  filter: "defined(body)",
  migrate: {
    document(doc) {
      const body = (doc.body ?? []) as BodyBlock[];
      return changedBlocks(body, normalizeBody(body)).map((block) =>
        at(["body", { _key: block._key }], set(block)),
      );
    },
  },
});
