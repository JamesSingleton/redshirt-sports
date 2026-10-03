import { LinkIcon } from "@sanity/icons/Link";
import { defineArrayMember, defineField, defineType } from "sanity";

import { warnWhenHeadingOrBlockIsAllBold } from "../../utils/portable-text-validations";

export const legalContent = defineType({
  name: "legalContent",
  title: "Legal Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      validation: (rule) => [warnWhenHeadingOrBlockIsAllBold(rule)],
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Section", value: "h2" },
        { title: "Subsection", value: "h3" },
        { title: "Minor heading", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Underline", value: "underline" },
        ],
        annotations: [
          defineArrayMember({
            name: "customLink",
            type: "object",
            title: "Internal/External Link",
            icon: LinkIcon,
            fields: [
              defineField({
                name: "customLink",
                type: "customUrl",
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
