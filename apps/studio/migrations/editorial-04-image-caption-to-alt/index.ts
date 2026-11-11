import { at, defineMigration, set, setIfMissing, unset } from "sanity/migrate";

import type { BodyBlock } from "../../house-rules/types";
import {
  changedBlocks,
  moveInlineCaptionsToAlt,
} from "../../utils/body-transforms";

/**
 * Article photos used one "caption" field as their alt text. Photos now have
 * `alt` and no caption, so move the caption into `alt` (unless alt is already
 * set) and remove it, on the lead image and on every photo in the body.
 */
export default defineMigration({
  title: "Move article image captions to alt text",
  documentTypes: ["post"],
  filter: "defined(image) || defined(body)",
  migrate: {
    document(doc) {
      const patches = [];
      const image = doc.image as { alt?: string; caption?: string } | undefined;
      if (image?.caption !== undefined) {
        const caption = image.caption?.trim();
        if (caption && !image.alt) {
          patches.push(at("image.alt", setIfMissing(caption)));
        }
        patches.push(at("image.caption", unset()));
      }

      const body = (doc.body ?? []) as BodyBlock[];
      for (const block of changedBlocks(body, moveInlineCaptionsToAlt(body))) {
        patches.push(at(["body", { _key: block._key }], set(block)));
      }
      return patches;
    },
  },
});
