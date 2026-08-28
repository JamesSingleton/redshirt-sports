import { LinkIcon } from "@sanity/icons/Link";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineArrayMember, defineField, defineType } from "sanity";

const TABLE_CELL_BLOCK_STYLES = [{ title: "Normal", value: "normal" }];

const customLinkAnnotation = {
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
};

const tableCellMarks = {
  annotations: [customLinkAnnotation],
  decorators: [
    { title: "Strong", value: "strong" },
    { title: "Emphasis", value: "em" },
    { title: "Code", value: "code" },
  ],
};

/** Legacy @sanity/table row — must be a registered type so Studio can resolve _type: "tableRow". */
export const legacyTableRow = defineType({
  name: "tableRow",
  title: "Row (legacy @sanity/table)",
  type: "object",
  fields: [
    defineField({
      name: "cells",
      type: "array",
      title: "Cells",
      of: [{ type: "string" }],
    }),
  ],
  preview: {
    select: { cells: "cells" },
    prepare({ cells }) {
      const preview = Array.isArray(cells)
        ? cells.filter(Boolean).join(" · ")
        : "";
      return {
        title: preview || "Legacy table row",
        subtitle: "Replace table to use native editing",
      };
    },
  },
});

/** Native PT table cell (canonical name for @portabletext/plugin-table). */
export const ptTableCell = defineType({
  name: "cell",
  title: "Cell",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "array",
      title: "Content",
      of: [
        defineArrayMember({
          type: "block",
          styles: TABLE_CELL_BLOCK_STYLES,
          marks: tableCellMarks,
        }),
      ],
    }),
  ],
});

/** Native PT table row (canonical name for @portabletext/plugin-table). */
export const ptTableRow = defineType({
  name: "row",
  title: "Row",
  type: "object",
  fields: [
    defineField({
      name: "cells",
      type: "array",
      title: "Cells",
      of: [{ type: "cell" }],
    }),
  ],
});

/**
 * Portable Text table block. Register as a top-level type so the built-in table
 * plugin binds correctly (see Sanity PTE table docs).
 */
export const ptTable = defineType({
  name: "table",
  title: "Table",
  type: "object",
  icon: ThLargeIcon,
  fields: [
    defineField({
      name: "headerRows",
      type: "number",
      title: "Header Rows",
      description: "How many rows at the top of the table are headers.",
    }),
    defineField({
      name: "rows",
      type: "array",
      title: "Rows",
      of: [{ type: "row" }, { type: "tableRow" }],
    }),
  ],
  preview: {
    select: {
      rows: "rows",
    },
    prepare({ rows }) {
      const rowCount = Array.isArray(rows) ? rows.length : 0;
      const columnCount = Array.isArray(rows?.[0]?.cells)
        ? rows[0].cells.length
        : 0;
      return {
        title:
          rowCount && columnCount
            ? `${rowCount}×${columnCount} Table`
            : "Table",
      };
    },
  },
});
