import { SplitHorizontalIcon } from "@sanity/icons/SplitHorizontal";
import { defineField, defineType } from "sanity";

/**
 * A published playoff bracket from the admin app. Brackets live in Postgres,
 * so the block stores the edition id ("Copy embed ID" on the bracket page).
 */
export const bracketEmbed = defineType({
  name: "bracketEmbed",
  type: "object",
  title: "Playoff Bracket",
  icon: SplitHorizontalIcon,
  fields: [
    defineField({
      name: "editionId",
      type: "string",
      title: "Bracket embed ID",
      description:
        "From admin → Playoff brackets → the bracket → Copy embed ID. Only published brackets show on the site.",
      validation: (rule) =>
        rule
          .required()
          .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            { name: "embed ID" },
          ),
    }),
    defineField({
      name: "caption",
      type: "string",
      title: "Caption",
    }),
  ],
  preview: {
    select: { caption: "caption", editionId: "editionId" },
    prepare({ caption, editionId }) {
      return {
        title: caption || "Playoff bracket",
        subtitle: editionId,
        media: SplitHorizontalIcon,
      };
    },
  },
});
