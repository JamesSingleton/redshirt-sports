import { ImageIcon } from "@sanity/icons/Image";
import { LinkIcon } from "@sanity/icons/Link";
import { PlayIcon } from "@sanity/icons/Play";
import { TwitterIcon } from "@sanity/icons/Twitter";
import { defineArrayMember, defineField, defineType } from "sanity";

import { warnWhenHeadingOrBlockIsAllBold } from "../../utils/portable-text-validations";
import { getYouTubeId } from "../../utils/youtube";

// Module scope so the icon component identity is stable across renders.
const SanityLogoIcon = () => (
  <svg
    width={12}
    height={12}
    viewBox="0 0 654 869"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor" fillRule="nonzero">
      <path d="M343.36,744.64 C251.78,744.64 187.08,704.35 159.98,630.86 L0.46,630.86 C34.6,780.14 162,868.65 344.77,868.65 C453.44,868.65 546.21,830.93 600.45,764.96 C598.22,697.56 576,647.43 529,609.34 C513.78,693.66 445.35,744.64 343.36,744.64 Z" />
      <path d="M320.67,123.39 C429.86,123.39 473.76,185.33 491.09,228.56 L643.69,228.56 C608.91,83.5 491.64,0.76 319.25,0.76 C214.4,0.76 124.31,39.4 71,107 C73.64,167.86 97.19,215.7 143.35,252.26 C160.62,172.94 227.15,123.39 320.67,123.39 Z" />
      <path d="M436.38,381 L277.65,343.62 C234.863333,332.62 197.98,318.646667 167,301.7 C97.3,263.5 57.17,210 45.6,140 C45.17,140.87 44.76,141.76 44.34,142.63 C28.55,175.42 20.34,212.07 20.34,250.63 C20.34,371.11 89.02,445.51 230.34,478.08 L386.18,514 C432.4,526.19 471.41,540.84 503.74,558.49 C577.39,598.69 616.34,654.49 626.53,732.16 C626.9,731.44 627.25,730.71 627.61,729.99 C644.78,696.05 653.47,657.76 653.47,615.61 C653.49,463.53 535.43,404.08 436.38,381 Z" />
    </g>
  </svg>
);

const customLinkAnnotation = {
  name: "customLink",
  type: "object",
  title: "Internal/External Link",
  icon: LinkIcon,
  fields: [defineField({ name: "customLink", type: "customUrl" })],
};

const legacyLinkAnnotation = {
  title: "URL (Legacy)",
  name: "link",
  type: "object",
  fields: [
    {
      title: "URL",
      name: "href",
      type: "url",
      description: `Only use this if you are linking to a website outside of ${process.env.NEXT_PUBLIC_APP_NAME}. If you are linking to a ${process.env.NEXT_PUBLIC_APP_NAME} page, use the internal link option.`,
      validation: (rule: any) =>
        rule.uri({ scheme: ["https", "mailto", "tel"] }),
    },
    {
      title: "Open in new tab",
      name: "blank",
      description: "Read https://css-tricks.com/use-target_blank/",
      type: "boolean",
      initialValue: true,
    },
  ],
};

const legacyInternalLinkAnnotation = {
  name: "internalLink",
  title: "Internal Link (legacy)",
  type: "object",
  description:
    "Deprecated, use Internal/External Link instead. Existing links still work.",
  icon: SanityLogoIcon,
  fields: [
    {
      title: "Reference",
      name: "reference",
      type: "reference",
      to: [{ type: "post" }, { type: "school" }, { type: "author" }],
    },
  ],
};

// Table cells: simple text, links, and a small image. No tables or embeds.
export const cellBlock = defineArrayMember({
  name: "block",
  type: "block",
  styles: [{ title: "Normal", value: "normal" }],
  lists: [],
  marks: {
    decorators: [
      { title: "Strong", value: "strong" },
      { title: "Italic", value: "em" },
    ],
    annotations: [customLinkAnnotation],
  },
});

export const cellImage = defineArrayMember({
  name: "image",
  type: "image",
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    {
      name: "caption",
      type: "string",
      title: "Alt text",
      description: "Describe the image for accessibility.",
      validation: (rule) => rule.required(),
    },
  ],
});

const richTextMembers = [
  defineArrayMember({
    name: "block",
    type: "block",
    // Declaring styles replaces the defaults; normal is always included.
    styles: [
      { title: "Normal", value: "normal" },
      { title: "Heading 2", value: "h2" },
      { title: "Heading 3", value: "h3" },
      { title: "Heading 4", value: "h4" },
      { title: "Heading 5", value: "h5" },
      { title: "Heading 6", value: "h6" },
      { title: "Quote", value: "blockquote" },
    ],
    validation: (rule) => [warnWhenHeadingOrBlockIsAllBold(rule)],
    marks: {
      annotations: [
        customLinkAnnotation,
        legacyLinkAnnotation,
        legacyInternalLinkAnnotation,
      ],
    },
  }),
  defineArrayMember({
    name: "image",
    title: "Image",
    type: "image",
    icon: ImageIcon,
    options: { hotspot: true },
    fields: [
      {
        name: "caption",
        type: "string",
        title: "Alt text",
        description:
          "Describe the image for accessibility. This is not displayed on the page.",
        validation: (rule) => rule.required(),
      },
      {
        name: "attribution",
        type: "string",
        title: "Attribution",
        description: "Where did the photo come from?",
        validation: (rule) => rule.required(),
      },
    ],
  }),
  defineArrayMember({ type: "twitter", icon: TwitterIcon }),
  defineArrayMember({ type: "table" }),
  defineArrayMember({
    name: "youtubeEmbed",
    title: "YouTube Embed",
    type: "object",
    icon: PlayIcon,
    fields: [
      defineField({
        name: "url",
        title: "YouTube URL",
        type: "url",
        description:
          "Enter a YouTube video URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)",
        validation: (rule) =>
          rule
            .required()
            .uri({ scheme: ["http", "https"] })
            .custom((url) =>
              getYouTubeId(url) ? true : "Enter a valid YouTube video URL",
            ),
      }),
    ],
    preview: {
      select: { url: "url" },
      prepare({ url }) {
        const id = getYouTubeId(url);
        return {
          title: id ? `YouTube Video (${id})` : "YouTube Embed",
          subtitle: url,
          media: PlayIcon,
        };
      },
    },
  }),
];

export const blockContent = defineType({
  name: "blockContent",
  type: "array",
  of: richTextMembers,
});
