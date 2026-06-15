import { defineField, defineType } from "sanity";

import {
  customUrlPreviewSelect,
  prepareCustomUrlPreview,
} from "../../utils/custom-url-preview";
import {
  createRadioListLayout,
  isRelativeUrl,
  isValidUrl,
} from "../../utils/helper";

const allLinkableTypes = [
  { type: "post" },
  { type: "school" },
  { type: "author" },
  { type: "legal" },
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
        "Enter a full URL for external sites (e.g. https://example.com). For pages on this site, use Internal instead.",
      hidden: ({ parent }) => parent?.type !== "external",
      validation: (Rule) => [
        Rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          if (type === "external") {
            if (!value) {
              return "URL can't be empty";
            }
            if (isRelativeUrl(value)) {
              return "Use Internal → Custom path for site paths starting with /";
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
      name: "internalType",
      type: "string",
      title: "Internal link type",
      description:
        "Choose how to link to a page on this site. School/team pages use Document; sport news archives use Sport news archive.",
      hidden: ({ parent }) => parent?.type !== "internal",
      options: createRadioListLayout([
        { title: "Document", value: "reference" },
        { title: "Custom path", value: "custom" },
        { title: "Sport news archive", value: "sportNews" },
      ]),
      initialValue: () => "reference",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          if (type === "internal" && !value) {
            return "Internal link type is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "internal",
      type: "reference",
      title: "Document",
      description:
        "Select a post, school/team page, author, or legal document on your website",
      options: { disableNew: true },
      hidden: ({ parent }) =>
        parent?.type !== "internal" || parent?.internalType !== "reference",
      to: allLinkableTypes,
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          const internalType = (parent as { internalType?: string })
            ?.internalType;
          if (
            type === "internal" &&
            internalType === "reference" &&
            !value?._ref
          ) {
            return "Document can't be empty";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "internalUrl",
      type: "string",
      title: "Custom path",
      description:
        "Enter a relative URL starting with / (e.g. /about, /contact, /college/news)",
      hidden: ({ parent }) =>
        parent?.type !== "internal" || parent?.internalType !== "custom",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          const internalType = (parent as { internalType?: string })
            ?.internalType;
          if (type === "internal" && internalType === "custom") {
            if (!value) {
              return "Path can't be empty";
            }
            if (!value.startsWith("/")) {
              return "Internal path must start with /";
            }
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "sportNewsLink",
      title: "Sport news archive",
      type: "sportNewsLink",
      description:
        "Build a link to a sport news listing page. Not for school or team pages (/college/teams/...).",
      hidden: ({ parent }) =>
        parent?.type !== "internal" || parent?.internalType !== "sportNews",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type;
          const internalType = (parent as { internalType?: string })
            ?.internalType;
          if (
            type === "internal" &&
            internalType === "sportNews" &&
            !(value as { sport?: { _ref?: string } })?.sport?._ref
          ) {
            return "Sport news archive link is required";
          }
          return true;
        }),
      ],
    }),
  ],
  preview: {
    select: customUrlPreviewSelect,
    prepare: prepareCustomUrlPreview,
  },
});
