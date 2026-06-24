/**
 * governing-body.ts
 *
 * Represents a collegiate athletic governing body or association.
 * Keeping this as a document (rather than a string enum on `classification`)
 * means editors can add new governing bodies — CCCAA, USCAA, any future
 * regional or faith-based association — directly in the Studio without
 * waiting for a schema change or deployment.
 *
 * Seed documents to create on first deploy:
 *   NCAA    National Collegiate Athletic Association
 *   NAIA    National Association of Intercollegiate Athletics
 *   NJCAA   National Junior College Athletic Association
 *   NCCAA   National Christian College Athletic Association
 *   CCCAA   California Community College Athletic Association
 *   USCAA   United States Collegiate Athletic Association
 *
 * Note on USCAA: it operates across traditional NCAA/NAIA lines. A school
 * like Virginia State University is NCAA Division II for football (CIAA)
 * but USCAA for baseball (New South Athletic Conference) and soccer
 * (independent). This is handled at the school level via per-sport
 * conferenceAffiliations — the governing body document itself just needs
 * to exist.
 *
 * Document cost: 6–10 documents total, fixed. Not a quota concern.
 */

import { defineField, defineType } from "sanity";

import { createSlug } from "@/utils/slug";

export const governingBody = defineType({
  name: "governingBody",
  title: "Governing Body",
  type: "document",
  fields: [
    defineField({
      name: "abbreviation",
      title: "Abbreviation",
      type: "string",
      description:
        'The widely recognized short form. e.g. "NCAA", "NAIA", "NJCAA"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      description:
        'The official full name. e.g. "National Collegiate Athletic Association"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        // Source from abbreviation so slugs are short: "ncaa", "naia", "njcaa"
        source: "abbreviation",
        slugify: createSlug,
        // Need to bring this back
        // isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
      description:
        "A brief plain-language description for editors. Who does this body govern? What level of competition?",
    }),
    defineField({
      name: "website",
      title: "Official Website",
      type: "url",
      description:
        "Optional. Used for editorial reference — not displayed on the site.",
      validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description:
        "Uncheck to retire a governing body without deleting it. Inactive bodies are hidden from all article and classification forms.",
    }),
  ],

  preview: {
    select: {
      title: "abbreviation",
      subtitle: "name",
      media: "logo",
    },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle,
      media,
    }),
  },

  orderings: [
    {
      title: "Abbreviation A-Z",
      name: "abbreviationAsc",
      by: [{ field: "abbreviation", direction: "asc" }],
    },
  ],
});
