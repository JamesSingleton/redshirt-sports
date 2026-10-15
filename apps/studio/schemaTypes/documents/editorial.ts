import { FileText, Mic, User, Video } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import { documentSlugField } from "../common";

const personRoles = [
  { title: "Writer", value: "writer" },
  { title: "Editor", value: "editor" },
  { title: "Photographer", value: "photographer" },
  { title: "Podcast host", value: "podcastHost" },
  { title: "Video host", value: "videoHost" },
  { title: "Voter", value: "voter" },
  { title: "Staff", value: "staff" },
  { title: "Contributor", value: "contributor" },
  { title: "Columnist", value: "columnist" },
  { title: "Analyst", value: "analyst" },
];

/** People sit beside the existing author type. Posts still reference authors. */
export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  icon: User,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("person", { required: true }),
    defineField({
      name: "roles",
      type: "array",
      of: [{ type: "string" }],
      options: { list: personRoles },
    }),
    defineField({ name: "title", type: "string" }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "bio", type: "text" }),
    defineField({
      name: "isStaff",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      readOnly: true,
    }),
  ],
});

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: FileText,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("category", { required: true }),
  ],
});

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: FileText,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("page", { required: true, rejectReserved: true }),
    defineField({
      name: "sections",
      type: "array",
      of: [
        defineArrayMember({
          name: "pageHero",
          type: "object",
          fields: [
            defineField({ name: "headline", type: "string" }),
            defineField({ name: "dek", type: "text" }),
          ],
        }),
        defineArrayMember({
          name: "pageFaq",
          type: "object",
          fields: [
            defineField({
              name: "items",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "question", type: "string" }),
                    defineField({ name: "answer", type: "text" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        defineArrayMember({
          name: "pageCta",
          type: "object",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "href", type: "string" }),
          ],
        }),
      ],
    }),
  ],
});

export const podcastShow = defineType({
  name: "podcastShow",
  title: "Podcast show",
  type: "document",
  icon: Mic,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("podcastShow", { required: true }),
    defineField({
      name: "hosts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "person" }] }],
    }),
  ],
});

export const podcastEpisode = defineType({
  name: "podcastEpisode",
  title: "Podcast episode",
  type: "document",
  icon: Mic,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("podcastEpisode", { required: true }),
    defineField({
      name: "show",
      type: "reference",
      to: [{ type: "podcastShow" }],
    }),
    defineField({ name: "audioUrl", type: "url" }),
    defineField({ name: "publishedAt", type: "datetime" }),
  ],
});

export const video = defineType({
  name: "video",
  title: "Video",
  type: "document",
  icon: Video,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    documentSlugField("video", { required: true }),
    defineField({ name: "url", type: "url" }),
    defineField({
      name: "hosts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "person" }] }],
    }),
  ],
});

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "leadHeadline",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "leadDek", type: "text" }),
  ],
});

export const pollRelease = defineType({
  name: "pollRelease",
  title: "Poll release",
  type: "document",
  fields: [
    defineField({
      name: "pollSlug",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seasonYear",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "weekNumber",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "intro", type: "text" }),
  ],
});

export const bracketPromo = defineType({
  name: "bracketPromo",
  title: "Bracket promo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "division", type: "string" }),
    defineField({ name: "year", type: "number" }),
    defineField({ name: "href", type: "string" }),
  ],
});

export const jobPosting = defineType({
  name: "jobPosting",
  title: "Job posting",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "remote", type: "boolean", initialValue: false }),
    defineField({ name: "employmentType", type: "string" }),
    defineField({ name: "description", type: "text" }),
    defineField({ name: "validThrough", type: "date" }),
    defineField({ name: "applyUrl", type: "url" }),
  ],
});
