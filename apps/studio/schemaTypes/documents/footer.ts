import { LayoutPanelLeft, Link, PanelBottom } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

import {
  formatSiteLinkSubtitle,
  nestedSiteLinkPreviewSelect,
  resolveSiteLinkPreview,
  type SiteLinkPreviewInput,
} from "../../utils/site-link-preview";

const footerColumnLink = defineField({
  name: "footerColumnLink",
  type: "object",
  icon: Link,
  title: "Footer link",
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
  preview: {
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
  },
});

const footerColumn = defineField({
  name: "footerColumn",
  type: "object",
  icon: LayoutPanelLeft,
  title: "Footer column",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Column title",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "links",
      type: "array",
      title: "Links",
      of: [defineArrayMember(footerColumnLink)],
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
        title: title || "Untitled Column",
        subtitle: `${links.length} link${links.length === 1 ? "" : "s"}`,
      };
    },
  },
});

export const footer = defineType({
  name: "footer",
  type: "document",
  title: "Footer",
  description: "Footer content for your website",
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Footer",
      title: "Label",
      description: "Internal label used to identify footer in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      type: "text",
      rows: 2,
      title: "Subtitle",
      description: "Subtitle beneath the logo in the footer",
    }),
    defineField({
      name: "columns",
      type: "array",
      title: "Columns",
      of: [defineArrayMember(footerColumn)],
      options: { sortable: true },
    }),
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Footer",
      media: PanelBottom,
    }),
  },
});
