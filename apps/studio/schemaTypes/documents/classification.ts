/**
 * classification.ts
 *
 * Represents a level within a governing body — e.g. "NCAA Division I",
 * "NAIA", "NJCAA Division II". References the `governingBody` document
 * so editors can add new governing bodies in the Studio without a
 * schema change or deployment.
 *
 * Slug conventions (must match your Next.js route segments):
 *   NCAA Division I    → d1       (kept short; guarded by $division != "d1")
 *   NCAA Division II   → d2
 *   NCAA Division III  → d3
 *   NAIA               → naia
 *   NJCAA Division I   → njcaa-d1 (prefixed to avoid colliding with NCAA d1)
 *   NJCAA Division II  → njcaa-d2
 *   NJCAA Division III → njcaa-d3
 *   NCCAA Division I   → nccaa-d1
 *   NCCAA Division II  → nccaa-d2
 *   CCCAA              → cccaa
 *   USCAA              → uscaa
 *
 * Single-level bodies (NAIA, CCCAA, USCAA) have one classification
 * document each. Multi-level bodies (NCAA, NJCAA, NCCAA) have one
 * document per division level.
 *
 * Migration from `division`:
 *   1. Deploy this schema alongside the existing `division` schema.
 *   2. Create the governing body seed documents.
 *   3. Create the classification seed documents above.
 *   4. Run a migration to update all `division._ref` fields across
 *      `post`, `conference`, `sportSubgrouping`, and `school` documents
 *      to point at the equivalent `classification` document.
 *   5. Remove the `division` schema once all references are migrated.
 */

import { defineField, defineType } from "sanity";

import { createSlug } from "../../utils/slug";

export const classification = defineType({
  name: "classification",
  title: "Classification",
  type: "document",
  fields: [
    defineField({
      name: "governingBody",
      title: "Governing Body",
      type: "reference",
      to: [{ type: "governingBody" }],
      description:
        "The association that governs this classification. e.g. NCAA, NAIA, NJCAA.",
      options: {
        disableNew: false,
        filter: "active == true",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description:
        'Full display name. e.g. "NCAA Division I", "NAIA", "NJCAA Division II"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "shortName",
      title: "Short Name",
      type: "string",
      description:
        'Abbreviated label used in UI and previews. e.g. "NCAA D1", "NAIA", "NJCAA D2"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "Used in URLs. Follow the slug conventions in the schema comments. Do not edit an existing slug — it will break live routes.",
      options: {
        source: "name",
        slugify: createSlug,
        // isUnique,
      },
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      title: "name",
      governingBodyAbbr: "governingBody.abbreviation",
      governingBodyLogo: "governingBody.logo",
    },
    prepare: ({ title, governingBodyAbbr, governingBodyLogo }) => ({
      title: title ?? "Unnamed classification",
      subtitle: governingBodyAbbr,
      media: governingBodyLogo,
    }),
  },

  orderings: [
    {
      title: "Governing Body, then Name",
      name: "governingBodyThenName",
      by: [
        { field: "governingBody.abbreviation", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name A–Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
