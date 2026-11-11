import { EarthAmericasIcon } from "@sanity/icons/EarthAmericas";
import { defineField, defineType } from "sanity";

import { createSlug, isUniqueWithinType } from "@/utils/slug";

/**
 * A collegiate athletic association: NCAA, NAIA, NJCAA, NCCAA, CCCAA, USCAA.
 * A document rather than a fixed list so a new association can be added in
 * the Studio. A school can sit under different bodies by sport; that is
 * recorded per sport on the school's conference affiliations.
 */
export const governingBody = defineType({
  name: "governingBody",
  type: "document",
  icon: EarthAmericasIcon,
  fields: [
    defineField({
      name: "abbreviation",
      type: "string",
      description: 'The short form everyone uses: "NCAA", "NAIA", "NJCAA".',
      validation: (rule) => [
        rule.required().error("Add the abbreviation."),
        rule
          .custom((value: string | undefined) =>
            !value || value === value.toUpperCase()
              ? true
              : "Abbreviations are written in capitals.",
          )
          .error(),
      ],
    }),
    defineField({
      name: "name",
      title: "Full name",
      type: "string",
      description: 'e.g. "National Collegiate Athletic Association".',
      validation: (rule) => rule.required().error("Add the full name."),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "abbreviation",
        slugify: createSlug,
        isUnique: isUniqueWithinType,
      },
      validation: (rule) => rule.required().error("Press Generate."),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description:
        "Who this body governs and at what level, in plain language.",
    }),
    defineField({
      name: "website",
      title: "Official website",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
    }),
    defineField({
      name: "logo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required().error("Describe the logo."),
        }),
      ],
    }),
    defineField({
      name: "active",
      type: "boolean",
      initialValue: true,
      description:
        "Turn off to retire a governing body without deleting it. It disappears from the division picker.",
    }),
  ],
  preview: {
    select: { title: "abbreviation", subtitle: "name", media: "logo" },
  },
  orderings: [
    {
      title: "Abbreviation A-Z",
      name: "abbreviationAsc",
      by: [{ field: "abbreviation", direction: "asc" }],
    },
  ],
});
