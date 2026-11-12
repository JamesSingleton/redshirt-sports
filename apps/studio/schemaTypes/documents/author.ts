import { UserIcon } from "@sanity/icons/User";
import { defineArrayMember, defineField, defineType } from "sanity";

import { StudioAccountInput } from "@/components/studio-account-input";
import { budgetInput } from "@/components/text-budget-input";
import { LIMITS } from "@/house-rules/limits";
import { API_VERSION } from "@/utils/constant";
import { createSlug, isUnique } from "@/utils/slug";
import { documentSlugField } from "../common";
import { socialLinks } from "../definitions/social-links";

export const AUTHOR_ROLES = [
  "Founder",
  "Editor",
  "Senior Writer",
  "Correspondent",
  "Contributor",
  "Guest Writer",
  "Recruiting Analyst",
  "Transfer Portal Analyst",
  "Historian",
  "Podcast Host",
];

export const author = defineType({
  name: "author",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "profile", title: "Profile", default: true },
    { name: "expertise", title: "Expertise" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "profile",
      description: "As it appears in bylines.",
      validation: (rule) => [
        rule.required().error("An author needs a name."),
        rule
          .custom((value: string | undefined) =>
            value && value !== value.trim().replace(/\s+/g, " ")
              ? "Remove the extra spaces in the name."
              : true,
          )
          .error(),
      ],
    }),
    documentSlugField("author", {
      group: "profile",
      title: "Profile URL",
      description:
        "The author's page address, made from the name. Changing it creates a redirect.",
      required: true,
      slugOptions: {
        source: "name",
        maxLength: 96,
        slugify: createSlug,
        isUnique,
      },
    }),
    defineField({
      name: "roles",
      type: "array",
      group: "profile",
      description: "Shown next to the name. Most senior role first.",
      of: [
        defineArrayMember({ type: "string", options: { list: AUTHOR_ROLES } }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Give the author at least one role."),
        rule.unique(),
        rule
          .max(3)
          .warning("More than three roles is hard to read in a byline."),
      ],
    }),
    defineField({
      name: "image",
      title: "Headshot",
      type: "image",
      group: "profile",
      description:
        "A square-ish photo of the author's face. Set the hotspot on the face.",
      options: { hotspot: true },
      validation: (rule) => rule.required().error("Add a headshot."),
    }),
    defineField({
      name: "biography",
      title: "Bio",
      type: "text",
      rows: 4,
      group: "profile",
      description: `Third person, present tense. Say what they cover and why they know it: beats, years covering the sport, where else they've been published. ${LIMITS.authorBio.min} to ${LIMITS.authorBio.max} characters.`,
      components: {
        input: budgetInput({
          max: LIMITS.authorBio.max,
          min: LIMITS.authorBio.min,
        }),
      },
      validation: (rule) => [
        rule
          .required()
          .error(
            "Write a bio. Readers and search engines use it to judge who is behind the article.",
          ),
        rule
          .max(LIMITS.authorBio.max)
          .error(`Keep the bio to ${LIMITS.authorBio.max} characters.`),
        rule
          .min(LIMITS.authorBio.min)
          .warning(
            `A bio under ${LIMITS.authorBio.min} characters rarely says what the author covers.`,
          ),
        rule
          .custom((value: string | undefined) =>
            value && /\b(?:I|my|me)\b/.test(value)
              ? "Write the bio in the third person."
              : true,
          )
          .warning(),
      ],
    }),
    defineField({ ...socialLinks, group: "profile" }),
    defineField({
      name: "beats",
      type: "array",
      group: "expertise",
      description:
        "Sports this author covers regularly. Shown on their profile.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sport" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "credentials",
      type: "array",
      group: "expertise",
      description:
        'Verifiable credentials, one per line: "FWAA member", "Stats Perform FCS Top 25 voter", "Covering the Big Sky since 2015".',
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) => rule.required().max(100),
        }),
      ],
      validation: (rule) => [rule.unique(), rule.max(6)],
    }),
    defineField({
      name: "studioUserId",
      title: "Studio account",
      type: "string",
      group: "profile",
      description:
        "The Studio login of the person who writes as this author. New articles they create start with them in the byline.",
      components: { input: StudioAccountInput },
      validation: (rule) =>
        rule.custom(async (value: string | undefined, context) => {
          if (!value) return true;
          const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
          const other = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string | null>(
              `*[_type == "author" && studioUserId == $value && !(_id in [$id, "drafts." + $id])][0].name`,
              { value, id },
            );
          return other
            ? `This Studio account is already linked to ${other}. Unlink it there first.`
            : true;
        }),
    }),
    defineField({
      name: "archived",
      title: "No longer writing for us",
      type: "boolean",
      group: "profile",
      description:
        "Removes the author from the staff page and from byline pickers. Their articles and profile stay online.",
      initialValue: false,
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
    select: {
      title: "name",
      roles: "roles",
      media: "image",
      archived: "archived",
    },
    prepare: ({ title, roles, media, archived }) => ({
      title,
      subtitle: [archived ? "Archived" : null, ...(roles ?? [])]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
