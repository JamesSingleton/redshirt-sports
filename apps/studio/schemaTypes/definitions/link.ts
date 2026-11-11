import { LinkIcon } from "@sanity/icons/Link";
import { defineField, defineType } from "sanity";

import {
  LINK_TYPES,
  type LinkValue,
  linkTargetFindings,
} from "@/house-rules/links";
import { houseRule } from "@/house-rules/sanity";

const linkTypeOf = (parent: unknown) =>
  (parent as LinkValue | undefined)?.linkType;

/**
 * The link annotation for article and legal bodies: one button, three kinds
 * of destination. Pages with their own document are linked by reference so a
 * slug change can't break the link.
 */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "linkType",
      title: "Links to",
      type: "string",
      options: { list: [...LINK_TYPES], layout: "radio" },
      initialValue: "internal",
    }),
    defineField({
      name: "reference",
      title: "Page",
      type: "reference",
      // Weak: a link must never stop the page it points at from being
      // unpublished or deleted (a takedown can't wait on finding every
      // article that links to it). If the page goes, the link renders as text.
      weak: true,
      description: "Search by headline, team, or name.",
      to: [
        { type: "post" },
        { type: "school" },
        { type: "author" },
        { type: "legal" },
      ],
      options: {
        disableNew: true,
        // Only documents that have a page: published articles, teams with a
        // hub, authors still on staff.
        filter:
          'defined(slug.current) && (_type != "post" || defined(publishedAt)) && (_type != "author" || archived != true)',
      },
      hidden: ({ parent }) => linkTypeOf(parent) !== "internal",
    }),
    defineField({
      name: "path",
      type: "string",
      description:
        "Everything after the domain, e.g. /college/football/news/fcs or /college/football/rankings/fcs.",
      hidden: ({ parent }) => linkTypeOf(parent) !== "path",
    }),
    defineField({
      name: "href",
      title: "Web address",
      type: "url",
      description: "The full address, starting with https://.",
      validation: (rule) =>
        rule.uri({ scheme: ["https", "http", "mailto", "tel"] }),
      hidden: ({ parent }) => linkTypeOf(parent) !== "external",
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in a new tab",
      type: "boolean",
      initialValue: true,
      hidden: ({ parent }) => linkTypeOf(parent) !== "external",
    }),
  ],
  validation: (rule) =>
    houseRule<LinkValue, typeof rule>(rule, (value) =>
      linkTargetFindings(value),
    ),
});
