import { defineField } from "sanity";

import { CharacterCountInput } from "../components/character-count";
import { GROUP } from "./constant";

export const seoFields = [
  defineField({
    name: "seoTitle",
    title: "SEO meta title override",
    description:
      'Shown in search results. 60 characters or fewer, with no site name: the site adds " | Redshirt Sports". If left blank, the full headline is used, which often runs too long.',
    type: "string",
    validation: (rule) => [
      // A custom warning, not required(): older posts have no seoTitle, and
      // required() would also make the generated type non-optional.
      rule
        .custom((value) =>
          value
            ? true
            : "Add an SEO title so search results don't use the full headline",
        )
        .warning(),
      rule
        .max(60)
        .error('60 characters or fewer (the site adds " | Redshirt Sports")'),
    ],
    group: GROUP.SEO,
    components: {
      input: CharacterCountInput,
    },
  }),
  defineField({
    name: "seoDescription",
    title: "SEO meta description override",
    description:
      "This will override the meta description. If left blank it will inherit the description from the page description.",
    type: "text",
    rows: 2,
    validation: (rule) => [
      rule
        .custom((value) => (value ? true : "A description is required"))
        .warning(),
      rule.max(155).error("155 characters or fewer"),
    ],
    group: GROUP.SEO,
    components: {
      input: CharacterCountInput,
    },
  }),
  defineField({
    name: "seoImage",
    title: "SEO image override",
    description:
      "This will override the article image. If left blank it will inherit the image from the article.",
    type: "image",
    group: GROUP.SEO,
    options: {
      hotspot: true,
    },
  }),
];
