import { AD_PLACEMENTS } from "@redshirt-sports/sanity/ad-placements";
import { Megaphone } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const placementOptions = AD_PLACEMENTS.map((placement) => ({
  title: `${placement.title} (${placement.hint})`,
  value: placement.id,
}));

export const advertisement = defineType({
  name: "advertisement",
  title: "Sponsorship",
  type: "document",
  icon: Megaphone,
  description:
    "A sponsor creative that fills one or more existing ad slots. The live site hides a slot until a published sponsorship matches it. Draft preview shows a sponsorship before its start date so you can check the layout. Create a separate sponsorship when the image or link should differ by slot.",
  fields: [
    defineField({
      name: "name",
      title: "Internal name",
      type: "string",
      description:
        'Only visible in Studio. Example: "Nike — homepage leaderboard — Oct 2026".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sponsorName",
      title: "Sponsor name",
      type: "string",
      description:
        "Public name. Used as the image alt text when the image has none.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Creative",
      type: "image",
      description:
        "Upload the artwork at the size shown on the placement you pick. A wide leaderboard and a sidebar square need separate sponsorships.",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "What the image shows. Example: Nike swoosh.",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "url",
      title: "Link",
      type: "customUrl",
      description:
        "Where the creative goes. External sponsor links open in a new tab on the site.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "placements",
      title: "Placements",
      type: "array",
      description: "Slots this creative is allowed to fill.",
      of: [
        defineArrayMember({
          type: "string",
          options: { list: placementOptions },
        }),
      ],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "sports",
      title: "Sports",
      type: "array",
      description:
        "Leave empty to run everywhere those placements appear, including the homepage. Add sports to limit it to those sports. Team pages match any sport that school plays.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sport" }],
        }),
      ],
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description:
        "When two live sponsorships match the same slot, the higher number wins. A tie uses the most recently updated one.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0).max(100),
    }),
    defineField({
      name: "startsAt",
      title: "Starts",
      type: "datetime",
      description:
        "Leave empty to start as soon as this document is published.",
    }),
    defineField({
      name: "endsAt",
      title: "Ends",
      type: "datetime",
      description: "Leave empty to run until you unpublish it or turn it off.",
      validation: (rule) =>
        rule.custom((endsAt, context) => {
          const startsAt = context.document?.startsAt;
          if (
            typeof startsAt === "string" &&
            typeof endsAt === "string" &&
            new Date(endsAt) < new Date(startsAt)
          ) {
            return "End must be after the start";
          }
          return true;
        }),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description:
        "Turn off to hide this sponsorship immediately without unpublishing it.",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),
  ],
  initialValue: {
    active: true,
    priority: 0,
  },
  orderings: [
    {
      title: "Priority",
      name: "priorityDesc",
      by: [{ field: "priority", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "sponsorName",
      media: "image",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Sponsorship",
      subtitle,
      media,
    }),
  },
});
