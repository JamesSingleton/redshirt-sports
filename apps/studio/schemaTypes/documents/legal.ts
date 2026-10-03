import { GavelIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { CharacterCountInput } from "../../components/character-count";
import { createSlug, isUnique } from "../../utils/slug";

export const legal = defineType({
  name: "legal",
  title: "Legal Document",
  type: "document",
  icon: GavelIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'e.g. "Privacy Policy" or "Terms of Service"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The document is published at /legal/<slug>",
      options: {
        source: "title",
        maxLength: 96,
        isUnique,
        slugify: createSlug,
      },
      validation: (rule) =>
        rule.required().custom((slug) => {
          if (!slug?.current) return true;
          return (
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current) ||
            "Use lowercase letters, numbers, and single hyphens only"
          );
        }),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description:
        "A plain-language overview shown under the title and used as the search engine description",
      components: {
        input: CharacterCountInput,
      },
      validation: (rule) =>
        rule
          .required()
          .max(160)
          .warning("Keep it under 160 characters for best SEO"),
    }),
    defineField({
      name: "effectiveDate",
      title: "Effective Date",
      type: "date",
      description: "The date this version of the document takes effect",
      options: { dateFormat: "MMMM D, YYYY" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "date",
      description:
        "Set this when you make a material change. Leave blank if the document hasn't changed since it took effect. Typo fixes don't need a new date.",
      options: { dateFormat: "MMMM D, YYYY" },
      validation: (rule) =>
        rule.custom((lastUpdated, context) => {
          const effectiveDate = context.document?.effectiveDate as
            | string
            | undefined;
          if (lastUpdated && effectiveDate && lastUpdated < effectiveDate) {
            return "Last updated can't be before the effective date";
          }
          return true;
        }),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "legalContent",
      description:
        'Use "Section" headings for each major part — they build the table of contents on the page',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Title",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      effectiveDate: "effectiveDate",
    },
    prepare: ({ title, slug, effectiveDate }) => ({
      title,
      subtitle: [
        slug ? `/legal/${slug}` : null,
        effectiveDate ? `Effective ${effectiveDate}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
