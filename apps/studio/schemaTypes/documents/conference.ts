import { UsersIcon } from "@sanity/icons/Users";
import {
  defineArrayMember,
  defineField,
  defineType,
  type Reference,
} from "sanity";

import { API_VERSION } from "@/utils/constant";
import { createSlug, isUniqueWithinType } from "@/utils/slug";

type Affiliation = {
  _key?: string;
  sport?: Reference;
  subgrouping?: Reference;
};

const refOf = (value: unknown) => (value as Reference | undefined)?._ref;

export const conference = defineType({
  name: "conference",
  type: "document",
  icon: UsersIcon,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "level", title: "Division" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "identity",
      description: 'Full name: "Missouri Valley Football Conference".',
      validation: (rule) => rule.required().error("A conference needs a name."),
    }),
    defineField({
      name: "shortName",
      type: "string",
      group: "identity",
      description: 'How it is said in copy: "Missouri Valley", "Big Sky".',
      validation: (rule) => rule.required().error("Add the short name."),
    }),
    defineField({
      name: "abbreviation",
      type: "string",
      group: "identity",
      description: '"MVFC", "SEC", "CAA".',
      validation: (rule) => rule.required().error("Add the abbreviation."),
    }),
    defineField({
      name: "slug",
      title: "URL segment",
      type: "slug",
      group: "identity",
      description:
        "Its part of news URLs, e.g. /college/football/news/fcs/big-sky. Changing it breaks those URLs.",
      options: {
        source: "name",
        maxLength: 96,
        slugify: createSlug,
        isUnique: isUniqueWithinType,
      },
      validation: (rule) =>
        rule.required().error("A conference needs a URL segment."),
    }),
    defineField({
      name: "logo",
      type: "image",
      group: "identity",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: 'e.g. "Big Sky Conference logo".',
        }),
      ],
    }),
    defineField({
      name: "primaryClassification",
      title: "Division",
      type: "reference",
      to: [{ type: "classification" }],
      group: "level",
      description: "e.g. NCAA Division I or NAIA.",
      options: { disableNew: true },
      validation: (rule) => rule.required().error("Pick the division."),
    }),
    defineField({
      name: "sports",
      title: "Sports sponsored",
      type: "array",
      group: "level",
      description:
        "Sports the conference sponsors that we cover. A football-only league lists football alone.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sport" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("List at least one sport."),
        rule.unique(),
      ],
    }),
    defineField({
      name: "sportSubdivisionAffiliations",
      title: "Subdivision by sport",
      type: "array",
      group: "level",
      description:
        "For each sport that is split within the division, which side the conference is on: Football → FCS, Men's Basketball → Mid-Major. Every member school inherits this unless the school sets its own override.",
      of: [
        defineArrayMember({
          type: "object",
          name: "sportSubgroupingAffiliation",
          title: "Sport subdivision",
          fields: [
            defineField({
              name: "sport",
              type: "reference",
              to: [{ type: "sport" }],
              options: {
                disableNew: true,
                filter: ({ document }) => {
                  const ids = (
                    (document?.sports as Reference[] | undefined) ?? []
                  ).map((sport) => sport._ref);
                  return ids.length
                    ? { filter: "_id in $ids", params: { ids } }
                    : { filter: "false" };
                },
              },
              validation: (rule) => rule.required().error("Pick the sport."),
            }),
            defineField({
              name: "subgrouping",
              title: "Subdivision",
              type: "reference",
              to: [{ type: "sportSubgrouping" }],
              options: {
                disableNew: true,
                filter: ({ document, parent }) => {
                  const sportId = refOf((parent as Affiliation)?.sport);
                  const classificationId = refOf(
                    document?.primaryClassification,
                  );
                  if (!sportId || !classificationId) return { filter: "false" };
                  return {
                    filter:
                      "parentClassification._ref == $classificationId && $sportId in applicableSports[]._ref",
                    params: { sportId, classificationId },
                  };
                },
              },
              validation: (rule) =>
                rule.required().error("Pick the subdivision."),
            }),
          ],
          preview: {
            select: {
              sport: "sport.title",
              shortName: "subgrouping.shortName",
              name: "subgrouping.name",
              kind: "subgrouping.kind",
            },
            prepare: ({ sport, shortName, name, kind }) => ({
              title: `${sport ?? "Sport"} → ${shortName ?? name ?? "?"}`,
              subtitle: kind === "common" ? "Common usage" : undefined,
            }),
          },
        }),
      ],
      validation: (rule) => [
        rule.custom((value: Affiliation[] | undefined, context) => {
          const rows = value ?? [];
          const sportIds = rows.map((row) => row.sport?._ref).filter(Boolean);
          if (new Set(sportIds).size !== sportIds.length) {
            return "Each sport can be listed once. A conference is on one side of a split.";
          }
          const sponsored = (
            (context.document?.sports as Reference[] | undefined) ?? []
          ).map((sport) => sport._ref);
          const stray = rows.find(
            (row) => row.sport?._ref && !sponsored.includes(row.sport._ref),
          );
          return stray
            ? {
                message:
                  "This sport isn't in Sports sponsored. Add it there or remove this row.",
                path: [{ _key: stray._key as string }],
              }
            : true;
        }),
        rule.custom(async (value: Affiliation[] | undefined, context) => {
          const classificationId = refOf(
            context.document?.primaryClassification,
          );
          const sponsored = (
            (context.document?.sports as Reference[] | undefined) ?? []
          )
            .map((sport) => sport._ref)
            .filter(Boolean);
          if (!classificationId || sponsored.length === 0) return true;

          // Sports this division splits, and so need an answer here.
          const split = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<Array<{ _id: string; title: string }>>(
              `*[_type == "sport" && _id in $sponsored && count(*[_type == "sportSubgrouping" && parentClassification._ref == $classificationId && ^._id in applicableSports[]._ref]) > 0]{_id, title}`,
              { sponsored, classificationId },
            );
          const answered = (value ?? []).map((row) => row.sport?._ref);
          const missing = split.filter(
            (sport) => !answered.includes(sport._id),
          );
          return missing.length
            ? `Say which subdivision the conference is in for ${missing.map((sport) => sport.title).join(", ")}.`
            : true;
        }),
      ],
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
      abbreviation: "abbreviation",
      level: "primaryClassification.shortName",
      media: "logo",
    },
    prepare: ({ title, abbreviation, level, media }) => ({
      title,
      subtitle: [abbreviation, level].filter(Boolean).join(" · "),
      media,
    }),
  },
});
