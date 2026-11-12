import type { CustomValidator } from "sanity";

import { API_VERSION } from "./constant";

/**
 * Blocks a second document of the same type from using a name another one
 * already has, so editors don't create a school, conference, or tag twice.
 * Compares case-insensitively against each of `against` on every other
 * document of `type`, drafts included.
 *
 * `sameField` narrows the check to documents that share that reference
 * (conference short names only clash within one division).
 */
export function uniqueName({
  type,
  label,
  against,
  sameField,
}: {
  type: string;
  /** "school", "conference": used in the message. */
  label: string;
  /** Fields on the other documents to compare with, e.g. ["name", "shortName"]. */
  against: string[];
  /** A reference field both documents must share, e.g. "primaryClassification". */
  sameField?: string;
}): CustomValidator<string | undefined> {
  return async (value, context) => {
    const name = value?.trim();
    if (!name) return true;
    const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
    const scopeRef = sameField
      ? (context.document?.[sameField] as { _ref?: string } | undefined)?._ref
      : undefined;
    if (sameField && !scopeRef) return true;

    const matches = against
      .map((field) => `lower(${field}) == lower($name)`)
      .join(" || ");
    const scope = sameField ? ` && ${sameField}._ref == $scopeRef` : "";
    const existing = await context
      .getClient({ apiVersion: API_VERSION })
      .fetch<string | null>(
        `*[_type == $type && !(_id in [$id, "drafts." + $id])${scope} && (${matches})][0].name`,
        { type, id, name, scopeRef: scopeRef ?? null },
      );
    return existing
      ? `A ${label} named "${existing}" already uses this. Open it instead of creating a second one.`
      : true;
  };
}
