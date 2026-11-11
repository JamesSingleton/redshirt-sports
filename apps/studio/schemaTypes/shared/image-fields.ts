import { defineField } from "sanity";

import { budgetInput } from "@/components/text-budget-input";
import { LIMITS } from "@/house-rules/limits";
import { houseRule } from "@/house-rules/sanity";
import { altTextFindings, creditFindings } from "@/house-rules/text";

/**
 * Fields every article photo carries: alt text for people who can't see the
 * image, and a credit for who owns it. The site shows no caption.
 */
export const editorialImageFields = [
  defineField({
    name: "alt",
    title: "Alt text",
    type: "string",
    description:
      'Say who is in the photo and what they are doing, e.g. "Montana quarterback Keali\'i Ah Yat throws under pressure against Montana State". Read aloud by screen readers.',
    components: { input: budgetInput({ max: LIMITS.altText.max }) },
    validation: (rule) =>
      houseRule<string, typeof rule>(rule, (value) => altTextFindings(value)),
  }),
  defineField({
    name: "attribution",
    title: "Credit",
    type: "string",
    description:
      'Photographer and owner, e.g. "Jane Doe / Montana Athletics". Only use images we have the right to publish.',
    validation: (rule) =>
      houseRule<string, typeof rule>(rule, (value) => creditFindings(value)),
  }),
];
