import { CogIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { socialLinks } from "../definitions/social-links";

export const settings = defineType({
  name: "settings",
  type: "document",
  title: "Settings",
  description: "Global settings and configuration for your website",
  icon: CogIcon,
  fields: [
    defineField({
      name: "label",
      type: "string",
      initialValue: "Settings",
      title: "Label",
      description: "Label used to identify settings in the CMS",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteBrand",
      type: "string",
      title: "Site Brand",
      description: "The brand name of your website",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteTitle",
      type: "string",
      title: "Site Title",
      description:
        "The default title of your website, used in browser tabs and SEO",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteDescription",
      type: "text",
      title: "Site Description",
      description: "A brief description of your website for SEO purposes",
      validation: (rule) => rule.required().min(140).max(160),
    }),
    defineField({
      name: "logo",
      type: "image",
      title: "Site Logo",
      description: "Upload your website logo",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "footerLogo",
      type: "image",
      title: "Footer Logo",
      description: "Upload your website footer logo",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "footerLogoDarkMode",
      type: "image",
      title: "Footer Logo Dark Mode",
      description: "Upload your website footer logo for Dark Mode",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "defaultOpenGraphImage",
      type: "image",
      title: "Default Open Graph Image",
      description:
        "Image used for social media sharing when no specific image is set",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "contactEmail",
      type: "string",
      title: "Contact Email",
      description: "Primary contact email address for your website",
      validation: (rule) => rule.email(),
    }),
    socialLinks,
    defineField({
      name: "newsroomPolicies",
      title: "Newsroom policies",
      type: "object",
      description:
        "Links to the pages that explain how the newsroom works. Shown to search engines in the site's structured data; Google News uses them as trust signals. Leave a field empty until its page exists.",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "publishingPrinciples",
          title: "Editorial standards",
          type: "url",
          description: "How articles are reported, sourced, and edited.",
          validation: (rule) =>
            rule.uri({ allowRelative: true, scheme: ["https"] }),
        }),
        defineField({
          name: "correctionsPolicy",
          title: "Corrections policy",
          type: "url",
          description: "How errors are corrected and noted.",
          validation: (rule) =>
            rule.uri({ allowRelative: true, scheme: ["https"] }),
        }),
        defineField({
          name: "ethicsPolicy",
          title: "Ethics policy",
          type: "url",
          description: "Conflicts of interest, gifts, sponsorships.",
          validation: (rule) =>
            rule.uri({ allowRelative: true, scheme: ["https"] }),
        }),
        defineField({
          name: "ownershipFundingInfo",
          title: "Ownership and funding",
          type: "url",
          description: "Who owns and pays for the site.",
          validation: (rule) =>
            rule.uri({ allowRelative: true, scheme: ["https"] }),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "label",
    },
    prepare: ({ title }) => ({
      title: title || "Untitled Settings",
      media: CogIcon,
    }),
  },
});
