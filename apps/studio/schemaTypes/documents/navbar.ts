import { LayoutPanelLeft, Link, PanelTop } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  formatSiteLinkSubtitle,
  nestedSiteLinkPreviewSelect,
  resolveSiteLinkPreview,
  type SiteLinkPreviewInput,
} from "../../utils/site-link-preview";

const siteLinkLinkPreview = {
  select: {
    title: "name",
    ...nestedSiteLinkPreviewSelect("link"),
  },
  prepare: ({
    title,
    ...linkFields
  }: { title?: string } & SiteLinkPreviewInput) => {
    const url = resolveSiteLinkPreview(linkFields);

    return {
      title: title || "Untitled Link",
      subtitle: formatSiteLinkSubtitle({
        linkType: linkFields.linkType,
        url,
        openInNewTab: linkFields.openInNewTab,
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
  description: "Top-level link shown directly in the navigation bar",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Link text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "link",
      type: "siteLink",
      title: "Destination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: siteLinkLinkPreview,
});

const navbarColumnLink = defineField({
  name: "navbarColumnLink",
  type: "object",
  icon: LayoutPanelLeft,
  title: "Dropdown link",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Link text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "groupLabel",
      type: "string",
      title: "Group label",
      description:
        'Optional heading for this link in the dropdown (e.g. "Browse by Division"). Consecutive links with the same label are grouped together.',
    }),
    defineField({
      name: "description",
      type: "string",
      title: "Description",
      description: "Optional subtitle shown below the link in dropdowns",
    }),
    defineField({
      name: "link",
      type: "siteLink",
      title: "Destination",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: siteLinkLinkPreview,
});

const navbarColumn = defineField({
  name: "navbarColumn",
  type: "object",
  icon: LayoutPanelLeft,
  title: "Navigation Dropdown",
  description: "A dropdown column in the navigation bar",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Dropdown label",
      description: "Text shown on the navigation bar for this dropdown",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sportSlug",
      type: "string",
      title: "Sport (for live Top 25 rankings)",
      description:
        'When set, the site injects current Top 25 ranking links into this dropdown',
      options: {
        list: [
          { title: "Football", value: "football" },
          { title: "Men's Basketball", value: "mens-basketball" },
          { title: "Women's Basketball", value: "womens-basketball" },
        ],
      },
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Dropdown links",
      of: [defineArrayMember(navbarColumnLink)],
      options: { sortable: true },
    }),
  ],
  preview: {
    select: {
      title: "title",
      links: "links",
    },
    prepare({ title, links = [] }) {
      return {
        title: title || "Untitled Dropdown",
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
      description: "Internal label for this configuration in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Navigation items",
      description: "Add dropdown columns or individual top-level links",
      of: [
        defineArrayMember(navbarColumn),
        defineArrayMember(navbarLink),
      ],
      options: { sortable: true },
    }),
  ],
  preview: {
    select: {
      title: "label",
      columns: "columns",
    },
    prepare({ title, columns = [] }) {
      return {
        title: title || "Site Navigation",
        subtitle: `${columns.length} item${columns.length === 1 ? "" : "s"}`,
      };
    },
  },
});
