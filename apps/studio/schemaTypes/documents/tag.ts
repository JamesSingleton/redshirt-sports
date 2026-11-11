import { TagIcon } from "@sanity/icons/Tag";
import { defineField, defineType } from "sanity";

import { API_VERSION } from "@/utils/constant";
import { createSlug, isUniqueWithinType } from "@/utils/slug";

export const TAG_KINDS = [
  {
    title:
      "Beat: an ongoing area of coverage (Recruiting, Transfer Portal, NIL)",
    value: "beat",
  },
  {
    title: "Series: a recurring feature (Bowl Projections, FCS Top 25)",
    value: "series",
  },
  {
    title: "Topic: anything else (Conference Realignment)",
    value: "topic",
  },
] as const;

/**
 * A recurring topic ("Coaching Changes", "Bowl Projections"). Teams,
 * conferences, sports, and article types have their own fields; a tag is for
 * what none of those say.
 */
export const tag = defineType({
  name: "tag",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      description:
        'Title Case, plural where it reads naturally: "Coaching Changes", not "coaching change". Don\'t create tags for teams, conferences, or article types.',
      validation: (rule) => [
        rule.required().error("A tag needs a name."),
        rule.max(40).error("Keep tag names to 40 characters."),
        rule.custom((value: string | undefined) => {
          if (!value) return true;
          if (value !== value.trim().replace(/\s+/g, " ")) {
            return "Remove the extra spaces.";
          }
          if (/[#,]/.test(value)) return "No # or commas in tag names.";
          return true;
        }),
        rule.custom(async (value: string | undefined, context) => {
          if (!value) return true;
          const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
          const existing = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string | null>(
              `*[_type == "tag" && !(_id in [$id, "drafts." + $id]) && lower(name) == lower($name)][0].name`,
              { id, name: value.trim() },
            );
          return existing ? `The tag "${existing}" already exists.` : true;
        }),
      ],
    }),
    defineField({
      name: "kind",
      type: "string",
      description:
        "What sort of label this is. The article's format (news, analysis, recap) is its article type, not a tag.",
      options: { list: [...TAG_KINDS], layout: "radio" },
      initialValue: "topic",
      validation: (rule) =>
        rule.required().error("Pick what kind of tag this is."),
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Made from the name. Locked once set, because feeds use it.",
      options: {
        source: "name",
        slugify: createSlug,
        isUnique: isUniqueWithinType,
      },
      readOnly: ({ document }) => !!document?.name && !!document?.slug,
      validation: (rule) => rule.required().error("Press Generate."),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description:
        "When to use this tag. Writers see it in the Studio; it is not shown on the site.",
    }),
  ],
  orderings: [
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", kind: "kind", description: "description" },
    prepare: ({ title, kind, description }) => ({
      title,
      subtitle: [
        kind ? kind[0].toUpperCase() + kind.slice(1) : null,
        description,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
