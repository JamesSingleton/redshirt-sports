import { StarIcon } from "@sanity/icons/Star";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { LayoutPanelLeft, Link, PanelTop } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

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

const navSportMenu = defineArrayMember({
  name: "navSportMenu",
  type: "object",
  icon: ThLargeIcon,
  title: "Sport Menu",
  description:
    "A sport's dropdown: its news hub, division news, and the sport's Top 25 polls (set on the sport document).",
  fields: [
    defineField({
      name: "sport",
      type: "reference",
      to: [{ type: "sport" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description:
        'Optional menu label, e.g. "College Football". Defaults to the sport title.',
    }),
    defineField({
      name: "divisions",
      title: "Division News Links",
      description: 'Shown as "By division" news links, in this order.',
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sportSubgrouping" }, { type: "division" }],
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    select: {
      label: "label",
      sportTitle: "sport.title",
      divisions: "divisions",
    },
    prepare: ({ label, sportTitle, divisions = [] }) => ({
      title: label || sportTitle || "Untitled sport menu",
      subtitle: `${divisions.length} division link${divisions.length === 1 ? "" : "s"}`,
      media: ThLargeIcon,
    }),
  },
});

const navRankingsMenu = defineArrayMember({
  name: "navRankingsMenu",
  type: "object",
  icon: StarIcon,
  title: "Rankings Menu",
  description:
    "Lists each sport's Top 25 polls (set on the sport document), grouped by sport.",
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Rankings",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sports",
      description: "Sports to include, in display order.",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "sport" }] })],
      validation: (rule) => [rule.required().min(1), rule.unique()],
    }),
  ],
  preview: {
    select: { label: "label", sports: "sports" },
    prepare: ({ label, sports = [] }) => ({
      title: label || "Rankings",
      subtitle: `${sports.length} sport${sports.length === 1 ? "" : "s"}`,
      media: StarIcon,
    }),
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
      name: "items",
      type: "array",
      title: "Menu Items",
      description:
        "Top-level navigation, left to right: sport menus, a rankings menu, single links, or columns of links.",
      of: [navSportMenu, navRankingsMenu, navbarLink, navbarColumn],
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Navigation Structure (Deprecated)",
      deprecated: {
        reason: 'Replaced by "Menu Items". Will be removed after migration.',
      },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
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
