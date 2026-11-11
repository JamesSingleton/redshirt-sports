import { StackCompactIcon } from "@sanity/icons/StackCompact";
import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * An ordered, hand-picked list of articles for one spot on the site. The
 * site reads a collection by its key, so editors control placement without
 * a deploy. Articles are weak references: pulling an article from the site
 * must never be blocked by it sitting in a collection.
 */
export const COLLECTION_KEYS = [
  {
    title:
      "Homepage top stories: shown first on the homepage, before the latest news",
    value: "home-top-stories",
  },
] as const;

export const collection = defineType({
  name: "collection",
  title: "Collection",
  type: "document",
  icon: StackCompactIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: 'For editors, e.g. "Homepage top stories".',
      validation: (rule) =>
        rule.required().error("Give the collection a title."),
    }),
    defineField({
      name: "key",
      title: "Where it appears",
      type: "string",
      options: { list: [...COLLECTION_KEYS], layout: "radio" },
      validation: (rule) => [
        rule.required().error("Pick where this collection appears."),
        rule.custom(async (value: string | undefined, context) => {
          if (!value) return true;
          const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
          const taken = await context
            .getClient({ apiVersion: "2025-06-11" })
            .fetch<number>(
              `count(*[_type == "collection" && key == $key && !(_id in [$id, "drafts." + $id])])`,
              { key: value, id },
            );
          return taken > 0
            ? "Another collection already fills this spot. Edit that one instead."
            : true;
        }),
      ],
    }),
    defineField({
      name: "articles",
      type: "array",
      description:
        "In display order, most important first. Unpublished or deleted articles are skipped on the site.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "post" }],
          weak: true,
          options: { disableNew: true, filter: "defined(publishedAt)" },
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error("Add at least one article."),
        rule.max(12).error("Keep a collection to 12 articles."),
        rule.unique(),
      ],
    }),
  ],
  preview: {
    select: { title: "title", key: "key", articles: "articles" },
    prepare: ({ title, key, articles }) => ({
      title,
      subtitle: [key, `${articles?.length ?? 0} articles`]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
