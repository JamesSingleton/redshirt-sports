import { defineField, defineType } from "sanity";

import { createRadioListLayout, isValidUrl } from "../../utils/helper";

const allLinkableTypes = [
  { type: "post" },
  { type: "school" },
  { type: "author" },
];

export const customUrl = defineType({
  name: "customUrl",
  type: "object",
  description:
    "Configure a link that can point to either an internal page or external website",
  fields: [
    defineField({
      name: "type",
      type: "string",
      description:
        "Choose whether this link points to another page on your site (internal) or to a different website (external)",
      options: createRadioListLayout(["internal", "external"]),
      initialValue: () => "external",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      description:
        "When enabled, clicking this link will open the destination in a new browser tab instead of navigating away from the current page",
      initialValue: () => false,
    }),
    defineField({
      name: "external",
      type: "string",
      title: "URL",
      description:
        "Enter a full https:// URL for external sites, or a site path starting with / (e.g. /college/football/news/fbs/sec for conference archives)",
      hidden: ({ parent }) => parent?.type !== "external",
      validation: (Rule) => [
        Rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          if (type === "external") {
            if (!value) {
              return "URL can't be empty";
            }
            const isValid = isValidUrl(value);
            if (!isValid) {
              return "Invalid URL";
            }
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "href",
      type: "string",
      description:
        "Technical field used internally to store the complete URL - you don't need to modify this",
      initialValue: () => "#",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "internal",
      type: "reference",
      description:
        "Select which page on your website this link should point to",
      options: { disableNew: true },
      hidden: ({ parent }) => parent?.type !== "internal",
      to: allLinkableTypes,
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          if (type === "internal" && !value?._ref) {
            return "internal can't be empty";
          }
          return true;
        }),
      ],
    }),
  ],
  preview: {
    select: {
      externalUrl: "external",
      urlType: "type",
      internalSlug: "internal.slug.current",
      internalType: "internal._type",
      openInNewTab: "openInNewTab",
    },
    prepare({
      externalUrl,
      urlType,
      internalSlug,
      internalType,
      openInNewTab,
    }) {
      const internalPaths: Record<string, string> = {
        post: `/${internalSlug}`,
        school: `/college/teams/${internalSlug}`,
        author: `/authors/${internalSlug}`,
      };
      const url =
        urlType === "external"
          ? externalUrl
          : (internalPaths[internalType as string] ?? internalSlug);
      const newTabIndicator = openInNewTab ? " ↗" : "";
      return {
        title: `${urlType === "external" ? "External" : "Internal"} Link`,
        subtitle: `${url}${newTabIndicator}`,
      };
    },
  },
});
