import { TiersIcon } from "@sanity/icons/Tiers";
import { defineField, defineType } from "sanity";

import { createSlug, isUniqueWithinType } from "@/utils/slug";

/**
 * A division within a governing body (the type is `classification` because
 * NAIA and others aren't NCAA-style divisions, but Studio and the site say
 * "division"): "NCAA Division I", "NAIA",
 * "NJCAA Division II". Sits between `governingBody` and `sportSubgrouping`:
 *
 *   NCAA (governing body)
 *   └─ NCAA Division I (classification)
 *      ├─ Football → FBS, FCS (subgroupings)
 *      └─ Basketball → Power Conferences, Mid-Major (subgroupings)
 *
 * The slug is a URL segment (/college/football/news/d2), so it must match the
 * route conventions: NCAA divisions are d1, d2, d3; single-level bodies use their
 * abbreviation (naia); other bodies are prefixed (njcaa-d1, nccaa-d2).
 */
export const classification = defineType({
  name: "classification",
  title: "Division",
  type: "document",
  icon: TiersIcon,
  fields: [
    defineField({
      name: "governingBody",
      type: "reference",
      to: [{ type: "governingBody" }],
      description: "The association this division belongs to.",
      options: { filter: "active != false" },
      validation: (rule) => rule.required().error("Pick the governing body."),
    }),
    defineField({
      name: "name",
      type: "string",
      description:
        'Full name with the governing body: "NCAA Division I", "NAIA", "NJCAA Division II". Used in page titles.',
      validation: (rule) => rule.required().error("A division needs a name."),
    }),
    defineField({
      name: "shortName",
      type: "string",
      description:
        'Compact label for badges and menus: "NCAA DI", "NAIA", "NJCAA DII".',
      validation: (rule) => [
        rule.required().error("A division needs a short name."),
        rule.max(12).error("Keep the short name to 12 characters."),
      ],
    }),
    defineField({
      name: "slug",
      title: "URL segment",
      type: "slug",
      description:
        "Its part of news URLs, e.g. /college/football/news/d2. Changing it breaks those URLs.",
      options: {
        source: "name",
        slugify: createSlug,
        isUnique: isUniqueWithinType,
      },
      validation: (rule) =>
        rule.required().error("A division needs a URL segment."),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description:
        "One or two sentences on what this division is. Used as the introduction on its news pages.",
    }),
  ],
  preview: {
    select: {
      title: "name",
      shortName: "shortName",
      slug: "slug.current",
      media: "governingBody.logo",
    },
    prepare: ({ title, shortName, slug, media }) => ({
      title: title ?? "Unnamed division",
      subtitle: [shortName, slug ? `/${slug}` : null]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
  orderings: [
    {
      title: "Governing body, then name",
      name: "governingBodyThenName",
      by: [
        { field: "governingBody.abbreviation", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
