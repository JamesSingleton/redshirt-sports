import { defineArrayMember, defineField, defineType } from "sanity";

import { createSlug, isUnique } from "@/utils/slug";

export const conference = defineType({
  name: "conference",
  title: "Conference",
  type: "document",
  fields: [
    defineField({
      title: "Name",
      name: "name",
      type: "string",
      description: "The name of the conference.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Short Name",
      name: "shortName",
      type: "string",
      description: "The short name of the conference.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Abbreviation",
      name: "abbreviation",
      type: "string",
      description: 'The abbreviation of the conference (e.g., "SEC", "ACC").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Slug",
      name: "slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
        slugify: createSlug,
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Logo",
      name: "logo",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["blurhash", "lqip"],
      },
      description: "Please provide a logo for the conference.",
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Just a brief description of the image.",
        }),
      ],
    }),
    defineField({
      name: "primaryClassification",
      title: "Primary Classification",
      type: "reference",
      to: [{ type: "classification" }], // Select: "NCAA Division I"
      description:
        "The level of competition this conference belongs to (e.g., NCAA D1, NAIA).",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sportSubdivisions",
      title: "Sport-Specific Subdivisions",
      description:
        "Define subdivisions for specific sports if they deviate from the broad primary classification (e.g., Football -> FCS).",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "sportSubdivisionAssignment",
          fields: [
            defineField({
              name: "sport",
              title: "Sport",
              type: "reference",
              to: [{ type: "sport" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "subdivision",
              title: "Subdivision",
              type: "reference",
              to: [{ type: "sportSubgrouping" }], // Points to your subgrouping documents
              validation: (rule) => rule.required(),

              // 🧠 DOUBLE FILTERING MAGIC:
              options: {
                filter: ({ document, parent }) => {
                  // 1. Get the Primary Classification from the parent Conference document
                  const classRef = (
                    document?.primaryClassification as { _ref?: string }
                  )?._ref;

                  // 2. Get the Sport selected in this specific row/line-item
                  const sportRef = (parent as { sport?: { _ref?: string } })
                    ?.sport?._ref;

                  // If the editor hasn't picked a sport yet, hide everything to force the correct order
                  if (!classRef || !sportRef) {
                    return { filter: "_id == null" };
                  }

                  return {
                    // Enforce that the subdivision belongs to this division AND includes this sport
                    filter:
                      "parentClassification._ref == $classRef && $sportRef in applicableSports[]._ref",
                    params: { classRef, sportRef },
                  };
                },
              },
            }),
          ],
          preview: {
            select: {
              sport: "sport.title",
              subdivision: "subdivision.shortName",
            },
            prepare: ({ sport, subdivision }) => ({
              title: sport,
              subtitle: subdivision,
            }),
          },
        }),
      ],
    }),
    defineField({
      title: "Division",
      name: "division",
      type: "reference",
      to: { type: "division" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Sports",
      name: "sports",
      description: "The sports that this conference sponsors.",
      // validation: (rule) => rule.required(),
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: { type: "sport" },
          options: {
            disableNew: true,
          },
        }),
      ],
    }),
    defineField({
      title: "Sport Subgrouping Affiliations",
      name: "sportSubdivisionAffiliations",
      type: "array",
      description:
        "For each sport this conference participates in, select the relevant subgrouping (e.g., for Football, select FBS or FCS; for Basketball, select Power 5 or Mid-Major).",
      of: [
        defineArrayMember({
          type: "object",
          name: "sportSubgroupingAffiliation",
          fields: [
            defineField({
              name: "sport",
              title: "Sport",
              type: "reference",
              description:
                "Select the sport and then the subgrouping that applies to this conference.",
              to: [{ type: "sport" }],
              validation: (rule) => rule.required(),
              options: {
                disableNew: true,
                filter: ({ document }) => {
                  const conferenceSportsRefs = Array.isArray(document?.sports)
                    ? document.sports
                    : [];

                  const conferenceSportIds = conferenceSportsRefs.map(
                    (s) => s._ref,
                  );

                  if (conferenceSportIds.length === 0) {
                    return { filter: "false" };
                  }

                  return {
                    filter: "_id in $conferenceSportIds",
                    params: { conferenceSportIds: conferenceSportIds },
                  };
                },
              },
            }),
            defineField({
              name: "subgrouping",
              title: "Subgrouping",
              type: "reference",
              to: [{ type: "sportSubgrouping" }],
              validation: (rule) => rule.required(),
              description:
                "Select the subgrouping that applies to this sport for this conference.",
              options: {
                disableNew: true,
                filter: ({ parent }) => {
                  const sportRef =
                    parent &&
                    !Array.isArray(parent) &&
                    typeof parent === "object"
                      ? (parent as { sport?: { _ref?: string } }).sport?._ref
                      : undefined;
                  if (!sportRef) {
                    return { filter: "false" };
                  }
                  return {
                    filter: "$sportId in applicableSports[]._ref",
                    params: { sportId: sportRef },
                  };
                },
              },
            }),
          ],
          preview: {
            select: {
              sportTitle: "sport.title",
              subgroupingName: "subgrouping.name",
              subgroupingShortName: "subgrouping.shortName",
            },
            prepare: ({
              sportTitle,
              subgroupingName,
              subgroupingShortName,
            }) => ({
              title: sportTitle,
              subtitle: subgroupingShortName || subgroupingName,
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule
          .unique()
          .min(1)
          .error("At least one sport subgrouping affiliation is required."),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "primaryClassification.name",
      media: "logo",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title,
      subtitle: subtitle,
      media,
    }),
  },
});
