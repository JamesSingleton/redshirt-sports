import { LinkIcon } from "@sanity/icons/Link";
import { defineField, defineType } from "sanity";

import {
  createRadioListLayout,
  isRelativeUrl,
  isValidUrl,
} from "../../utils/helper";
import {
  formatSiteLinkSubtitle,
  resolveSiteLinkPreview,
  siteLinkPreviewSelect,
} from "../../utils/site-link-preview";

const linkableDocumentTypes = [
  { type: "post" },
  { type: "school" },
  { type: "author" },
  { type: "legal" },
];

type SiteLinkParent = {
  linkType?: string;
  routeDepth?: string;
};

function linkType(parent: unknown): string | undefined {
  return (parent as SiteLinkParent | undefined)?.linkType;
}

export const siteLink = defineType({
  name: "siteLink",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  description: "Where this navigation item should go",
  fields: [
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      description: "Most nav links are site paths like /college/teams",
      options: createRadioListLayout([
        { title: "Site path", value: "sitePath" },
        { title: "Document", value: "document" },
        { title: "Sport news archive", value: "sportNews" },
        { title: "External URL", value: "external" },
      ]),
      initialValue: () => "sitePath",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sitePath",
      title: "Path",
      type: "string",
      description: "Relative URL starting with / (e.g. /college/teams)",
      hidden: ({ parent }) => linkType(parent) !== "sitePath",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const currentLinkType = linkType(parent);
          if (currentLinkType !== "sitePath") {
            return true;
          }
          if (!value) {
            return "Path is required";
          }
          if (!value.startsWith("/")) {
            return "Path must start with /";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "document",
      title: "Document",
      type: "reference",
      description: "Post, school, author, or legal page",
      to: linkableDocumentTypes,
      options: { disableNew: true },
      hidden: ({ parent }) => linkType(parent) !== "document",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          if (linkType(parent) === "document" && !value?._ref) {
            return "Document is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "sport",
      title: "Sport",
      type: "reference",
      to: [{ type: "sport" }],
      options: { disableNew: true },
      hidden: ({ parent }) => linkType(parent) !== "sportNews",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          if (linkType(parent) === "sportNews" && !value?._ref) {
            return "Sport is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "routeDepth",
      title: "Page depth",
      type: "string",
      description: "How specific the sport news archive link should be",
      options: createRadioListLayout([
        { title: "Sport news hub", value: "sportNews" },
        { title: "Division or subgrouping", value: "divisionNews" },
        { title: "Conference", value: "conferenceNews" },
      ]),
      initialValue: () => "sportNews",
      hidden: ({ parent }) => linkType(parent) !== "sportNews",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          if (linkType(parent) === "sportNews" && !value) {
            return "Page depth is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "segment",
      title: "Division or subgrouping",
      type: "reference",
      to: [{ type: "division" }, { type: "sportSubgrouping" }],
      options: {
        disableNew: true,
        filter: ({ parent }) => {
          const sportRef = (parent as { sport?: { _ref?: string } })?.sport
            ?._ref;
          if (!sportRef) {
            return { filter: "false" };
          }
          return {
            filter:
              "_type == 'division' || (_type == 'sportSubgrouping' && $sportId in applicableSports[]._ref)",
            params: { sportId: sportRef },
          };
        },
      },
      hidden: ({ parent }) => {
        const typedParent = parent as SiteLinkParent | undefined;
        if (typedParent?.linkType !== "sportNews") {
          return true;
        }
        return (
          typedParent.routeDepth === "sportNews" || !typedParent.routeDepth
        );
      },
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const typedParent = parent as SiteLinkParent | undefined;
          if (
            typedParent?.linkType === "sportNews" &&
            (typedParent.routeDepth === "divisionNews" ||
              typedParent.routeDepth === "conferenceNews") &&
            !value?._ref
          ) {
            return "Division or subgrouping is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "conference",
      title: "Conference",
      type: "reference",
      to: [{ type: "conference" }],
      options: {
        disableNew: true,
        filter: ({ parent }) => {
          const sportRef = (parent as { sport?: { _ref?: string } })?.sport
            ?._ref;
          const segmentRef = (parent as { segment?: { _ref?: string } })
            ?.segment?._ref;
          if (!sportRef || !segmentRef) {
            return { filter: "false" };
          }
          return {
            filter: `$sportId in sports[]._ref && (division._ref == $segmentId || count(sportSubdivisionAffiliations[subgrouping._ref == $segmentId && sport._ref == $sportId]) > 0)`,
            params: { sportId: sportRef, segmentId: segmentRef },
          };
        },
      },
      hidden: ({ parent }) => {
        const typedParent = parent as SiteLinkParent | undefined;
        if (typedParent?.linkType !== "sportNews") {
          return true;
        }
        return typedParent.routeDepth !== "conferenceNews";
      },
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const typedParent = parent as SiteLinkParent | undefined;
          if (
            typedParent?.linkType === "sportNews" &&
            typedParent.routeDepth === "conferenceNews" &&
            !value?._ref
          ) {
            return "Conference is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "external",
      title: "URL",
      type: "string",
      description: "Full URL for external sites (https://...)",
      hidden: ({ parent }) => linkType(parent) !== "external",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const currentLinkType = linkType(parent);
          if (currentLinkType !== "external") {
            return true;
          }
          if (!value) {
            return "URL is required";
          }
          if (isRelativeUrl(value)) {
            return "Use Site path for URLs starting with /";
          }
          if (!isValidUrl(value)) {
            return "Invalid URL";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
      initialValue: () => false,
    }),
  ],
  preview: {
    select: siteLinkPreviewSelect,
    prepare(input) {
      const url = resolveSiteLinkPreview(input);
      return {
        title: url ?? "Incomplete link",
        subtitle: formatSiteLinkSubtitle({
          linkType: input.linkType,
          url,
          openInNewTab: input.openInNewTab,
        }),
      };
    },
  },
});
