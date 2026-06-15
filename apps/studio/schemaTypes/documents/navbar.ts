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
  title: "Navigation Column",
  description: "A column of navigation links with an optional title",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Column Title",
      description:
        "The heading text displayed above this group of navigation links",
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Column Links",
      validation: (rule) => [rule.required(), rule.unique()],
      description: "The list of navigation links to display in this column",
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
      title: "Navigation Structure",
      description:
        "Build your navigation menu using columns and links. Add either a column of links or individual links.",
      of: [navbarColumn, navbarLink],
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
