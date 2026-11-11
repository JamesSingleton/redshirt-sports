import { defineField } from "sanity";

import { budgetInput } from "@/components/text-budget-input";
import { LIMITS, SITE_NAME } from "@/house-rules/limits";
import { houseRule } from "@/house-rules/sanity";
import { seoDescriptionFindings, seoTitleFindings } from "@/house-rules/text";

/**
 * Search and social overrides. Each one falls back to the article's own
 * headline, summary, and lead image, so they stay empty unless the default
 * doesn't fit.
 */
export function seoFields(options: { group: string; titleField?: string }) {
  const { group, titleField = "title" } = options;

  return [
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
      group,
      description: `The blue link in search results. ${LIMITS.seoTitle.max} characters or fewer, without "${SITE_NAME}" (the site adds it). Required when the headline is longer than ${LIMITS.seoTitle.max}; otherwise the headline is used.`,
      components: { input: budgetInput({ max: LIMITS.seoTitle.max }) },
      validation: (rule) =>
        houseRule<string, typeof rule>(rule, (value, context) =>
          seoTitleFindings(
            value,
            (context.document as Record<string, unknown> | undefined)?.[
              titleField
            ] as string | undefined,
          ),
        ),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 2,
      group,
      description: `The grey text under the link in search results. Leave empty to use the summary. ${LIMITS.seoDescription.max} characters or fewer.`,
      components: { input: budgetInput({ max: LIMITS.seoDescription.max }) },
      validation: (rule) =>
        houseRule<string, typeof rule>(rule, (value) =>
          seoDescriptionFindings(value),
        ),
    }),
    defineField({
      name: "seoImage",
      title: "Social share image",
      type: "image",
      group,
      description:
        "Replaces the lead image on social cards and in search. Leave empty to use the lead image.",
      options: { hotspot: true },
    }),
    defineField({
      name: "ogTitle",
      title: "Social headline",
      type: "string",
      group,
      description:
        "Headline on social cards (X, Facebook, iMessage). Leave empty to use the headline.",
      validation: (rule) =>
        rule
          .max(LIMITS.headline.max)
          .error(
            `Keep the social headline to ${LIMITS.headline.max} characters.`,
          ),
    }),
    defineField({
      name: "ogDescription",
      title: "Social description",
      type: "text",
      rows: 2,
      group,
      description:
        "Text under the headline on social cards. Leave empty to use the summary.",
      validation: (rule) =>
        rule.max(200).error("Keep the social description to 200 characters."),
    }),
  ];
}
