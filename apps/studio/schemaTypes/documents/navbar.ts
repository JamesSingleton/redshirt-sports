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
      title: "Level news links",
      description:
        'Shown as "By division" news links, in this order. Pick a subdivision (FCS, Mid-Major) or a whole level (NCAA DII).',
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "sportSubgrouping" }, { type: "classification" }],
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

const navRankingsLink = defineArrayMember({
  name: "navRankingsLink",
  type: "object",
  icon: Link,
  title: "Rankings Menu Link",
  description:
    "An extra link in one sport's section, after its Top 25 polls (e.g. computer ratings or a methodology page).",
  fields: [
    defineField({
      name: "sport",
      type: "reference",
      to: [{ type: "sport" }],
      description: "The section this link appears in.",
      validation: (rule) => [
        rule.required(),
        rule.custom((value, context) => {
          // Path: items[_key == menu].links[_key == link].sport
          const menuKey = (context.path?.[1] as { _key?: string } | undefined)
            ?._key;
          const items = (context.document?.items ?? []) as Array<{
            _key?: string;
            sports?: Array<{ _ref?: string }>;
          }>;
          const menu = items.find((item) => item._key === menuKey);
          if (!value?._ref || !menu) return true;
          return (menu.sports ?? []).some((sport) => sport._ref === value._ref)
            ? true
            : "Pick one of this menu's sports, or add the sport to the menu first.";
        }),
      ],
    }),
    defineField({
      name: "name",
      type: "string",
      title: "Link Text",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "string",
      title: "Description",
      description: "Optional line under the link text on desktop.",
    }),
    defineField({
      name: "url",
      type: "customUrl",
      title: "Link URL",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      sportTitle: "sport.title",
      ...nestedCustomUrlPreviewSelect("url"),
    },
    prepare: ({
      title,
      sportTitle,
      ...urlFields
    }: { title?: string; sportTitle?: string } & CustomUrlPreviewInput) => ({
      title: title || "Untitled Link",
      subtitle: [
        sportTitle,
        formatCustomUrlLinkSubtitle({
          urlType: urlFields.urlType,
          url: resolveCustomUrlPreview(urlFields),
          openInNewTab: urlFields.openInNewTab,
        }),
      ]
        .filter(Boolean)
        .join(" · "),
      media: Link,
    }),
  },
});

const navRankingsMenu = defineArrayMember({
  name: "navRankingsMenu",
  type: "object",
  icon: StarIcon,
  title: "Rankings Menu",
  description:
    "Lists each sport's Top 25 polls (set on the sport document), grouped by sport, plus any extra links.",
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
    defineField({
      name: "links",
      title: "Extra Links",
      description:
        "Shown in each sport's section after its polls, in this order (e.g. computer ratings, methodology).",
      type: "array",
      of: [navRankingsLink],
    }),
  ],
  preview: {
    select: { label: "label", sports: "sports", links: "links" },
    prepare: ({ label, sports = [], links = [] }) => ({
      title: label || "Rankings",
      subtitle: [
        `${sports.length} sport${sports.length === 1 ? "" : "s"}`,
        links.length
          ? `${links.length} link${links.length === 1 ? "" : "s"}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
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
