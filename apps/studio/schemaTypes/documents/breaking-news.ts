import { BellIcon } from "@sanity/icons/Bell";
import { defineField, defineType } from "sanity";

const MAX_HOURS = 48;

/**
 * The site-wide breaking-news banner: one article and when the banner comes
 * down. A singleton, so there is only ever one alert. The article is a weak
 * reference so the banner never blocks unpublishing it.
 */
export const breakingNews = defineType({
  name: "breakingNews",
  title: "Breaking news banner",
  type: "document",
  icon: BellIcon,
  fields: [
    defineField({
      name: "article",
      type: "reference",
      to: [{ type: "post" }],
      weak: true,
      description: "The article the banner links to.",
      options: { disableNew: true, filter: "defined(publishedAt)" },
      validation: (rule) => rule.required().error("Pick the article."),
    }),
    defineField({
      name: "label",
      type: "string",
      description:
        'Short text before the headline, e.g. "Breaking" or "Developing". Defaults to "Breaking".',
      validation: (rule) =>
        rule.max(20).error("Keep the label to 20 characters."),
    }),
    defineField({
      name: "expiresAt",
      title: "Take down at",
      type: "datetime",
      description: `The banner hides itself at this time. Up to ${MAX_HOURS} hours ahead; breaking news goes stale fast.`,
      initialValue: () =>
        new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      validation: (rule) =>
        rule.required().custom((value: string | undefined) => {
          if (!value) return true;
          const hours = (new Date(value).getTime() - Date.now()) / 3_600_000;
          return hours > MAX_HOURS
            ? `Take it down within ${MAX_HOURS} hours, or it stops being breaking news.`
            : true;
        }),
    }),
  ],
  preview: {
    select: { title: "article.title", expiresAt: "expiresAt", label: "label" },
    prepare: ({ title, expiresAt, label }) => {
      const live = expiresAt && new Date(expiresAt) > new Date();
      return {
        title: title ?? "No article",
        subtitle: live
          ? `${label || "Breaking"} · until ${new Date(expiresAt).toLocaleString("en-US")}`
          : "Not showing",
      };
    },
  },
});
