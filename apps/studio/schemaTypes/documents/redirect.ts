import { RedoIcon } from "@sanity/icons/Redo";
import { defineField, defineType, type SlugValue } from "sanity";

import { API_VERSION } from "@/utils/constant";

const pathRule = (value: SlugValue | undefined) => {
  const path = value?.current;
  if (!path) return "Add a path.";
  if (!path.startsWith("/")) return "The path must start with /.";
  if (/\s/.test(path)) return "Paths can't contain spaces.";
  if (path.length > 1 && path.endsWith("/")) return "Remove the trailing /.";
  return true;
};

/**
 * A path that moved. Created automatically when an article, author, or team
 * slug changes; add one by hand when a URL is retired.
 */
export const redirect = defineType({
  name: "redirect",
  type: "document",
  icon: RedoIcon,
  fields: [
    defineField({
      name: "source",
      title: "From",
      type: "slug",
      description: "The old path, e.g. /old-headline.",
      validation: (rule) => [
        rule.required().custom(pathRule),
        rule.custom(async (value: SlugValue | undefined, context) => {
          if (!value?.current) return true;
          const id = context.document?._id?.replace(/^drafts\./, "") ?? "";
          const taken = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<number>(
              `count(*[_type == "redirect" && !(_id in [$id, "drafts." + $id]) && source.current == $path])`,
              { id, path: value.current },
            );
          return taken > 0
            ? "Another redirect already starts at this path."
            : true;
        }),
      ],
    }),
    defineField({
      name: "destination",
      title: "To",
      type: "slug",
      description: "The path readers should land on.",
      validation: (rule) => [
        rule.required().custom(pathRule),
        rule.custom((value: SlugValue | undefined, context) => {
          const source = (context.document?.source as SlugValue | undefined)
            ?.current;
          return value?.current && value.current === source
            ? "A redirect can't point at itself."
            : true;
        }),
        rule.custom(async (value: SlugValue | undefined, context) => {
          if (!value?.current) return true;
          const chained = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string | null>(
              `*[_type == "redirect" && source.current == $path][0].destination.current`,
              { path: value.current },
            );
          return chained
            ? `This path is itself redirected to ${chained}. Point straight at ${chained} to avoid a chain.`
            : true;
        }),
      ],
    }),
    defineField({
      name: "permanent",
      type: "boolean",
      description:
        "On for a move that is final (301). Off for a temporary detour (302).",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      source: "source.current",
      destination: "destination.current",
      permanent: "permanent",
    },
    prepare: ({ source, destination, permanent }) => ({
      title: `${source ?? "?"} → ${destination ?? "?"}`,
      subtitle: permanent === false ? "Temporary (302)" : "Permanent (301)",
    }),
  },
});
