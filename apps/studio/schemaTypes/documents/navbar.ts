import { LayoutPanelLeft, Link, PanelTop } from "lucide-react";
import { defineField, defineType } from "sanity";

import {
  type CustomUrlPreviewInput,
  formatCustomUrlLinkSubtitle,
  nestedCustomUrlPreviewSelect,
  resolveCustomUrlPreview,
} from "../../utils/custom-url-preview";

const navbarLinkPreview = {
  select: {
    title: "name",
    ...nestedCustomUrlPreviewSelect("url"),
  },
  prepare: ({
    title,
    ...urlFields
  }: {
    title?: string;
  } & CustomUrlPreviewInput) => {
    const url = resolveCustomUrlPreview(urlFields);

    return {
      title: title || "Untitled Link",
      subtitle: formatCustomUrlLinkSubtitle({
        urlType: urlFields.urlType,
        url,
        openInNewTab: urlFields.openInNewTab,
      }),
      media: Link,
    };
  },
};

const navbarLink = defineField({
  name: "navbarLink",
  type: "object",
  icon: Link,
  title: "Navigation Link",
  description: "Individual navigation link with name and URL",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Link Text",
      description: "The text that will be displayed for this navigation link",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      description: "The URL that this link will navigate to when clicked",
    }),
  ],
  preview: navbarLinkPreview,
});

const navbarColumnLink = defineField({
  name: "navbarColumnLink",
  type: "object",
  icon: LayoutPanelLeft,
  title: "Navigation Column Link",
  description: "A link within a navigation column",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Link Text",
      description: "The text that will be displayed for this navigation link",
    }),
    defineField({
      name: "description",
      type: "string",
      title: "Description",
      description: "The description for this navigation link",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      description: "The URL that this link will navigate to when clicked",
    }),
  ],
  preview: navbarLinkPreview,
});

const navbarColumn = defineField({
  name: "navbarColumn",
  type: "object",
  icon: LayoutPanelLeft,
  title: "Dropdown Menu",
  description:
    "A dropdown in the primary bar. On mobile it becomes a section heading with its links listed below.",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Menu Label",
      description: "The text shown on the dropdown trigger, e.g. College",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Menu Links",
      validation: (rule) => [rule.required(), rule.unique()],
      description: "The links listed in this dropdown, in order",
      of: [navbarColumnLink],
    }),
  ],
  preview: {
    select: {
      title: "title",
      links: "links",
    },
    prepare({ title, links = [] }) {
      return {
        title: title || "Untitled Column",
        subtitle: `${links.length} link${links.length === 1 ? "" : "s"}`,
      };
    },
  },
});

export const navbar = defineType({
  name: "navbar",
  title: "Site Navigation",
  type: "document",
  icon: PanelTop,
  description: "Configure the main navigation structure for your site",
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Navbar",
      title: "Navigation Label",
      description:
        "Internal label to identify this navigation configuration in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Primary Navigation",
      description:
        "Items in the dark primary bar. Add a dropdown menu or a single link.",
      of: [navbarColumn, navbarLink],
    }),
    defineField({
      name: "secondaryLinks",
      type: "array",
      title: "Secondary Links",
      description:
        "Quick links in the light bar under the primary navigation, e.g. Top 25 Rankings or Vote.",
      of: [navbarLink],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      ...navbarLink,
      name: "cta",
      title: "Call to Action",
      description:
        "Optional button on the right side of the primary bar, e.g. Vote in the Top 25.",
    }),
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Navigation",
    }),
  },
});
