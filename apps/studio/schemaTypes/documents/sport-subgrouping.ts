import { SplitVerticalIcon } from "@sanity/icons/SplitVertical";
import {
  defineArrayMember,
  defineField,
  defineType,
  type Reference,
} from "sanity";

import { API_VERSION } from "@/utils/constant";
import { createSlug, isUniqueWithinType } from "@/utils/slug";

export const SUBGROUPING_KINDS = [
  {
    title: "NCAA designation: the NCAA defines who is in it (FBS, FCS)",
    value: "official",
  },
  {
    title:
      "Common usage: widely used, but the NCAA keeps no list (Power Conferences, Mid-Major)",
    value: "common",
  },
] as const;

/**
 * How a division is split for particular sports. The NCAA splits Division I
 * football into FBS and FCS. It doesn't split Division I basketball, but
 * fans, media, and sites like Mid-Major Madness do: "Power Conferences" and
 * "Mid-Major". No governing body keeps that list, so the definition field
 * records whose line we draw.
 *
 * Membership is set on the conference (conference × sport → subdivision) and
 * every school in the conference inherits it. A school that is the exception
 * sets an override on its own conference affiliation.
 */
export const sportSubgrouping = defineType({
  name: "sportSubgrouping",
  title: "Subdivision",
  type: "document",
  icon: SplitVerticalIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      description:
        'Full name: "Football Bowl Subdivision", "Mid-Major Conferences".',
      validation: (rule) =>
        rule.required().error("A subdivision needs a name."),
    }),
    defineField({
      name: "shortName",
      type: "string",
      description: 'What fans call it: "FBS", "Mid-Major".',
      validation: (rule) => rule.required().error("Add the short name."),
    }),
    defineField({
      name: "slug",
      title: "URL segment",
      type: "slug",
      description:
        "Its part of news URLs, e.g. /college/football/news/fcs. Changing it breaks those URLs.",
      options: {
        source: "shortName",
        slugify: createSlug,
        isUnique: isUniqueWithinType,
      },
      validation: (rule) =>
        rule.required().error("A subdivision needs a URL segment."),
    }),
    defineField({
      name: "parentClassification",
      title: "Division",
      type: "reference",
      to: [{ type: "classification" }],
      description: "The division this splits, e.g. NCAA Division I.",
      options: { disableNew: true },
      validation: (rule) => rule.required().error("Pick the division."),
    }),
    defineField({
      name: "applicableSports",
      title: "Sports",
      type: "array",
      description:
        "The sports this split applies to. FBS applies to football only; Mid-Major applies to men's and women's basketball.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sport" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Pick at least one sport."),
        rule.unique(),
      ],
    }),
    defineField({
      name: "kind",
      title: "Where the split comes from",
      type: "string",
      options: { list: [...SUBGROUPING_KINDS], layout: "radio" },
      validation: (rule) =>
        rule
          .required()
          .error("Say whether this is an NCAA designation or common usage."),
    }),
    defineField({
      name: "definition",
      title: "Who counts",
      type: "text",
      rows: 4,
      description:
        'The membership rule, in a sentence a reader could check. For common usage, say where we draw the line, e.g. "Division I conferences outside the ACC, Big East, Big Ten, Big 12, and SEC." Writers see it when tagging; it can also appear on the news page.',
      validation: (rule) => [
        rule
          .custom((value: string | undefined, context) =>
            context.document?.kind === "common" && !value?.trim()
              ? "Write down who counts. There's no NCAA list, and outlets draw the line differently (some call the AAC, A-10, and Mountain West high-major)."
              : true,
          )
          .warning(),
        rule.max(500).error("Keep the definition to 500 characters."),
      ],
    }),
  ],
  validation: (rule) =>
    rule.custom(async (document, context) => {
      // Within one division a sport is split by NCAA designation or by common
      // usage, never both (football can't be FBS/FCS and Power/Mid-Major).
      const doc = document as
        | {
            _id: string;
            kind?: string;
            parentClassification?: Reference;
            applicableSports?: Reference[];
          }
        | undefined;
      const sportIds = (doc?.applicableSports ?? []).map((sport) => sport._ref);
      if (!doc?.kind || !doc.parentClassification?._ref || !sportIds.length) {
        return true;
      }
      const id = doc._id.replace(/^drafts\./, "");
      const clash = await context
        .getClient({ apiVersion: API_VERSION })
        .fetch<string | null>(
          `*[_type == "sportSubgrouping" && !(_id in [$id, "drafts." + $id]) && parentClassification._ref == $classificationId && defined(kind) && kind != $kind && count(applicableSports[_ref in $sportIds]) > 0][0].shortName`,
          {
            id,
            classificationId: doc.parentClassification._ref,
            kind: doc.kind,
            sportIds,
          },
        );
      return clash
        ? `"${clash}" already splits one of these sports in this division the other way. A sport is split by NCAA designation or by common usage, not both.`
        : true;
    }),
  preview: {
    select: {
      title: "shortName",
      name: "name",
      division: "parentClassification.shortName",
      kind: "kind",
    },
    prepare: ({ title, name, division, kind }) => ({
      title: title ?? name,
      subtitle: [
        division,
        kind === "common" ? "Common usage" : kind ? "NCAA designation" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
