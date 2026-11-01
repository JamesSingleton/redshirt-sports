import { StarIcon } from "@sanity/icons/Star";
import { defineArrayMember, defineField, defineType } from "sanity";

import { SportPollInput } from "../../components/sport-poll-input";
import { GROUPS } from "../../utils/constant";
import { createSlug, isUnique } from "../../utils/slug";
import {
  ALL_POLL_OPTIONS,
  pollTitle,
  validateSportPoll,
} from "../../utils/sport-polls";

export const sport = defineType({
  name: "sport",
  title: "Sport",
  type: "document",
  groups: GROUPS,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        slugify: createSlug,
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "polls",
      title: "Top 25 Polls",
      description:
        "Polls shown in the navigation for this sport, in display order. Add a poll when it launches: its rankings page goes live once its first week is published.",
      type: "array",
      of: [
        defineArrayMember({
          name: "sportPoll",
          title: "Poll",
          type: "object",
          icon: StarIcon,
          fields: [
            defineField({
              name: "slug",
              title: "Poll",
              type: "string",
              // Full list for typegen; the input narrows it to this sport.
              options: { list: ALL_POLL_OPTIONS },
              components: { input: SportPollInput },
              validation: (rule) =>
                rule.required().custom((value: string | undefined, context) => {
                  const document = context.document as
                    | { slug?: { current?: string } }
                    | undefined;
                  return validateSportPoll(value, document?.slug?.current);
                }),
            }),
            defineField({
              name: "label",
              type: "string",
              description:
                'Optional short name for the navigation, e.g. "FBS". Defaults to the poll name.',
            }),
          ],
          preview: {
            select: { slug: "slug", label: "label" },
            prepare: ({ slug, label }) => ({
              title: `${label || pollTitle(slug) || "Untitled poll"} Top 25`,
              subtitle: slug,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((polls?: Array<{ slug?: string }>) => {
          const slugs = (polls ?? []).map((poll) => poll.slug).filter(Boolean);
          return new Set(slugs).size === slugs.length
            ? true
            : "Each poll can only be listed once";
        }),
    }),
  ],
});
