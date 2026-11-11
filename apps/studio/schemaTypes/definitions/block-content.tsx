import { blockInsertPicker } from "@sanity/block-insert-picker";
import { BlockquoteIcon } from "@sanity/icons/Blockquote";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { ImageIcon } from "@sanity/icons/Image";
import { PlayIcon } from "@sanity/icons/Play";
import { ShareIcon } from "@sanity/icons/Share";
import { TwitterIcon } from "@sanity/icons/Twitter";
import { defineArrayMember, defineField, defineType } from "sanity";

import { warnWhenHeadingOrBlockIsAllBold } from "@/utils/portable-text-validations";
import { editorialImageFields } from "../shared/image-fields";

const YOUTUBE_HOST = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i;
const YOUTUBE_ID =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/;

export const SOCIAL_EMBED_PLATFORMS = [
  { title: "Instagram", hosts: ["instagram.com"] },
  { title: "TikTok", hosts: ["tiktok.com"] },
  { title: "Bluesky", hosts: ["bsky.app"] },
  { title: "Threads", hosts: ["threads.net", "threads.com"] },
  { title: "Facebook", hosts: ["facebook.com", "fb.watch"] },
] as const;

export function socialPlatformFor(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const platform = SOCIAL_EMBED_PLATFORMS.find((entry) =>
      entry.hosts.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`),
      ),
    );
    return platform?.title ?? null;
  } catch {
    return null;
  }
}

/**
 * The article body. Styles and marks are limited to what the article template
 * renders: three heading levels, quotes, two list types, bold, italic, links.
 */
export const blockContent = defineType({
  name: "blockContent",
  // Type "/" (or Cmd/Ctrl+/) to insert any block this field allows.
  components: { portableText: { plugins: blockInsertPicker() } },
  title: "Article body",
  type: "array",
  of: [
    defineArrayMember({
      name: "block",
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bulleted list", value: "bullet" },
        { title: "Numbered list", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [defineArrayMember({ type: "link" })],
      },
      validation: (rule) => [warnWhenHeadingOrBlockIsAllBold(rule)],
    }),
    defineArrayMember({
      name: "image",
      title: "Photo",
      type: "image",
      icon: ImageIcon,
      options: { hotspot: true },
      fields: editorialImageFields,
    }),
    defineArrayMember({
      name: "pullQuote",
      title: "Pull quote",
      type: "object",
      icon: BlockquoteIcon,
      description:
        "A quote lifted out of the article for emphasis. For a quote that is part of the running text, use the Quote style instead.",
      fields: [
        defineField({
          name: "quote",
          type: "text",
          rows: 3,
          description: "The exact words, without quotation marks.",
          validation: (rule) => [
            rule.required().error("A pull quote needs the quote."),
            rule.max(300).error("Keep a pull quote to 300 characters."),
            rule
              .custom((value: string | undefined) =>
                value && /^["“”']|["“”']$/.test(value.trim())
                  ? "Leave out the quotation marks. The site adds them."
                  : true,
              )
              .warning(),
          ],
        }),
        defineField({
          name: "attribution",
          title: "Who said it",
          type: "string",
          description: 'Full name, e.g. "Bobby Hauck".',
          validation: (rule) =>
            rule.required().error("Say who the quote is from."),
        }),
        defineField({
          name: "role",
          title: "Their role",
          type: "string",
          description: 'e.g. "Montana head coach".',
        }),
      ],
      preview: {
        select: { quote: "quote", attribution: "attribution", role: "role" },
        prepare: ({ quote, attribution, role }) => ({
          title: quote ? `“${quote}”` : "Pull quote",
          subtitle: [attribution, role].filter(Boolean).join(", "),
          media: BlockquoteIcon,
        }),
      },
    }),
    defineArrayMember({
      name: "callout",
      type: "object",
      icon: BulbOutlineIcon,
      description:
        "A short boxed note set apart from the article: background, how something works, or a late update.",
      fields: [
        defineField({
          name: "kind",
          type: "string",
          options: {
            layout: "radio",
            direction: "horizontal",
            list: [
              { title: "Context", value: "context" },
              { title: "By the numbers", value: "numbers" },
              { title: "Update", value: "update" },
            ],
          },
          initialValue: "context",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "title",
          type: "string",
          description: 'e.g. "How the FCS playoff field is picked".',
          validation: (rule) =>
            rule.max(80).error("Keep the title to 80 characters."),
        }),
        defineField({
          name: "text",
          type: "text",
          rows: 4,
          validation: (rule) => [
            rule.required().error("A callout needs text."),
            rule
              .max(600)
              .error(
                "Keep a callout to 600 characters. Longer belongs in the article.",
              ),
          ],
        }),
      ],
      preview: {
        select: { title: "title", text: "text", kind: "kind" },
        prepare: ({ title, text, kind }) => ({
          title: title || text || "Callout",
          subtitle: `Callout · ${kind ?? "context"}`,
          media: BulbOutlineIcon,
        }),
      },
    }),
    defineArrayMember({
      name: "relatedArticle",
      title: "Related article",
      type: "object",
      icon: DocumentTextIcon,
      description:
        "A card linking to another Redshirt Sports article, placed where it is relevant.",
      fields: [
        defineField({
          name: "post",
          title: "Article",
          type: "reference",
          // Weak for the same reason as body links: placing a card must not
          // block unpublishing the article it shows. A missing one is skipped.
          weak: true,
          to: [{ type: "post" }],
          options: {
            disableNew: true,
            filter: "defined(publishedAt)",
          },
          validation: (rule) => [
            rule.required().error("Pick the article to link to."),
            rule.custom((value, context) => {
              const self = context.document?._id?.replace(/^drafts\./, "");
              return value?._ref && value._ref === self
                ? "An article can't link to itself."
                : true;
            }),
          ],
        }),
        defineField({
          name: "label",
          type: "string",
          description: 'Optional kicker above the card. Defaults to "Related".',
          validation: (rule) => rule.max(30),
        }),
      ],
      preview: {
        select: { title: "post.title", media: "post.image", label: "label" },
        prepare: ({ title, media, label }) => ({
          title: title ?? "Related article",
          subtitle: label || "Related",
          media: media ?? DocumentTextIcon,
        }),
      },
    }),
    defineArrayMember({ type: "table" }),
    defineArrayMember({ type: "twitter", icon: TwitterIcon }),
    defineArrayMember({
      name: "youtubeEmbed",
      title: "YouTube video",
      type: "object",
      icon: PlayIcon,
      fields: [
        defineField({
          name: "url",
          title: "YouTube URL",
          type: "url",
          description: "Paste the video link from YouTube.",
          validation: (rule) =>
            rule
              .required()
              .uri({ scheme: ["https"] })
              .custom((url) =>
                !url || YOUTUBE_HOST.test(url)
                  ? true
                  : "That isn't a YouTube link.",
              ),
        }),
      ],
      preview: {
        select: { url: "url" },
        prepare({ url }) {
          const videoId = url?.match(YOUTUBE_ID)?.[1];
          return {
            title: videoId ? `YouTube video (${videoId})` : "YouTube video",
            subtitle: url,
            media: PlayIcon,
          };
        },
      },
    }),
    defineArrayMember({
      name: "socialEmbed",
      title: "Social post",
      type: "object",
      icon: ShareIcon,
      description: `A post from ${SOCIAL_EMBED_PLATFORMS.map((p) => p.title).join(", ")}. For X use "X post"; for YouTube use "YouTube video".`,
      fields: [
        defineField({
          name: "url",
          title: "Post URL",
          type: "url",
          validation: (rule) =>
            rule
              .required()
              .uri({ scheme: ["https"] })
              .custom((url) =>
                !url || socialPlatformFor(url)
                  ? true
                  : `Paste a link from ${SOCIAL_EMBED_PLATFORMS.map((p) => p.title).join(", ")}.`,
              ),
        }),
        defineField({
          name: "caption",
          type: "string",
          description:
            "One line saying what the post shows. Displayed if the embed can't load, and read by search engines.",
          validation: (rule) =>
            rule
              .required()
              .error(
                "Describe the post so the article still reads if it's deleted.",
              ),
        }),
      ],
      preview: {
        select: { url: "url", caption: "caption" },
        prepare: ({ url, caption }) => ({
          title: caption || "Social post",
          subtitle: [socialPlatformFor(url), url].filter(Boolean).join(" · "),
          media: ShareIcon,
        }),
      },
    }),
    defineArrayMember({ type: "bracketEmbed" }),
  ],
});
