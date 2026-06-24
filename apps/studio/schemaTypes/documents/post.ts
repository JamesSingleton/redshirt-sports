import { defineArrayMember, defineField, defineType } from "sanity";

import { CharacterCountInput } from "@/components/character-count";
import { documentSlugField } from "@/schemaTypes/common";
import { GROUP, GROUPS, STORY_TYPES } from "@/utils/constant";
import { ogFields } from "@/utils/og-fields";
import {
  validateH2IsFirst,
  validateHeadingOrder,
} from "@/utils/portable-text-validations";
import { seoFields } from "@/utils/seo-fields";

const DIVISION_1_ID = "329c4f4f-bb7c-459e-872d-eb1a57deb196"; // Assuming this is the ID for Division 1

const postImageSubfields = [
  defineField({
    name: "caption",
    title: "Caption",
    type: "string",
    description: "Just a brief description of the image.",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "attribution",
    type: "string",
    title: "Attribution",
    description: "Who took the photo or where did you get the photo?",
    validation: (rule) => rule.required(),
  }),
];

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  groups: GROUPS,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description:
        "Make it as enticing as possible to convert users in social feeds and Google searches. Ideally between 15 and 70 characters.",
      group: GROUP.MAIN_CONTENT,
      validation: (rule) => rule.required(),
      components: {
        input: CharacterCountInput,
      },
    }),
    documentSlugField("post", {
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "storyType",
      title: "Story Type",
      type: "string",
      description:
        "Classifies this article for desk organization and on-site badges.",
      group: GROUP.MAIN_CONTENT,
      options: {
        list: [...STORY_TYPES],
        layout: "radio",
      },
      initialValue: "news",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "authors",
      title: "Authors",
      type: "array",
      description:
        "If only you wrote the article, select yourself. Otherwise, select the authors that contributed to the article.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [
            {
              type: "author",
              options: {
                disableNew: true,
              },
            },
          ],
          options: {
            disableNew: true,
          },
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required().unique(),
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      title: "Published At",
      group: GROUP.MAIN_CONTENT,
      readOnly: true,
      description:
        "This will be automatically generated when the post is published.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description:
        "Please provide an image for the article. Use something like https://squoosh.app or https://tinypng.com to compress the image first.",
      group: GROUP.MAIN_CONTENT,
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
      fields: postImageSubfields,
    }),
    defineField({
      title: "Sport",
      name: "sport",
      description: "What sport is this article about?",
      type: "reference",
      to: [{ type: "sport" }],
      group: GROUP.MAIN_CONTENT,
      options: {
        disableNew: true,
      },
    }),
    defineField({
      title: "Division",
      name: "division",
      description:
        "What's the primary division this article is about? If it's FCS, FBS, Mid-Major, or Power 5, select Division I.",
      type: "reference",
      to: [{ type: "division" }],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "sportSubgrouping",
      title: "Sport Subgrouping",
      type: "reference",
      to: [{ type: "sportSubgrouping" }],
      description:
        'Select a subgrouping related to the chosen sport (e.g., "FBS" for "Football", "Mid-Major" for "Basketball").',
      group: GROUP.MAIN_CONTENT,
      hidden: ({ document }) =>
        !document?.sport ||
        (document?.division as { _ref?: string } | undefined)?._ref !==
          DIVISION_1_ID,
      options: {
        disableNew: true,
        filter: ({ document }) => {
          const division = document.division as { _ref?: string } | undefined;
          const sport = document.sport as { _ref?: string } | undefined;
          if (!sport?._ref || division?._ref !== DIVISION_1_ID) {
            return {
              filter: `_id == null`,
            };
          }
          return {
            filter: "references($sportId)",
            params: { sportId: sport._ref },
          };
        },
      },
    }),
    defineField({
      title: "Conferences",
      name: "conferences",
      description: "What conferences does this article mention?",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "conference" }],
        }),
      ],
      hidden: ({ document }) => !document?.division,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: "Teams Mentioned",
      name: "teams",
      description: "What teams does this article mention?",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "school" }],
        }),
      ],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: "Tags",
      name: "tags",
      description:
        'Add tags to help with the "Related Articles" section on a post. Especially if you are not adding a conference or division.',
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "tag" }],
        }),
      ],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "excerpt",
      title: "Article Excerpt",
      type: "text",
      description:
        "Excerpt will be automatically generated when you publish a post",
      group: GROUP.MAIN_CONTENT,
      validation: (rule) =>
        rule
          .required()
          .min(140)
          .warning(
            "Excerpt should be at least 140 characters for optimal SEO visibility in search results.",
          )
          .max(160)
          .warning(
            "Excerpt should be at most 160 characters for optimal SEO visibility in search results.",
          ),
      components: {
        input: CharacterCountInput,
      },
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      group: GROUP.MAIN_CONTENT,
      // @ts-expect-error not sure why there's a type error here
      validation: (rule) => [
        validateH2IsFirst(rule),
        validateHeadingOrder(rule),
        rule.required(),
      ],
    }),
    ...seoFields,
    ...ogFields,
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      date: "publishedAt",
      storyType: "storyType",
    },
    prepare: ({ title, media, date, storyType }) => {
      const typeLabel =
        STORY_TYPES.find((t) => t.value === storyType)?.title ?? "News";
      const dateLabel = date
        ? new Date(date).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Missing publish date";

      return {
        title,
        media,
        subtitle: `${typeLabel} · ${dateLabel}`,
      };
    },
  },
});
