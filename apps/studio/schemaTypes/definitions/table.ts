import { ThListIcon } from "@sanity/icons/ThList";
import { defineArrayMember, defineField, defineType } from "sanity";

export const table = defineType({
  type: "object",
  name: "table",
  fields: [
    defineField({ type: "number", name: "headerRows" }),
    defineField({
      type: "array",
      name: "rows",
      of: [
        defineArrayMember({
          type: "object",
          name: "row",
          fields: [
            defineField({
              type: "array",
              name: "cells",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "cell",
                  fields: [
                    defineField({
                      type: "array",
                      name: "value",
                      of: [
                        defineArrayMember({
                          type: "block",
                          styles: [{ title: "Normal", value: "normal" }],
                          lists: [],
                          marks: {
                            decorators: [
                              { title: "Strong", value: "strong" },
                              { title: "Italic", value: "em" },
                            ],
                          },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { rows: "rows" },
    prepare: ({ rows }: { rows?: TableRow[] }) => {
      const count = rows?.length ?? 0;
      const columns = rows?.[0]?.cells?.length ?? 0;
      return {
        title: count
          ? `Table · ${count} rows × ${columns} columns`
          : "Empty table",
        subtitle: rows?.[0]?.cells?.map(cellText).join(" · "),
        media: ThListIcon,
      };
    },
  },
});

type TableRow = {
  cells?: Array<{ value?: Array<{ children?: Array<{ text?: string }> }> }>;
};

/** A cell's plain text, for the preview. */
function cellText(cell: NonNullable<TableRow["cells"]>[number]): string {
  return (cell.value ?? [])
    .flatMap((block) => block.children ?? [])
    .map((span) => span.text ?? "")
    .join("")
    .trim();
}
