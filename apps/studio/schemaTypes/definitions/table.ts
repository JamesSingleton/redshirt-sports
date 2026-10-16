import { defineArrayMember, defineField, defineType } from "sanity";

import { cellBlock, cellImage } from "./block-content";

export const table = defineType({
  type: "object",
  name: "table",
  fields: [
    // Must stay declared: the editor strips undeclared fields,
    // and header row support silently breaks without it.
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
                      of: [cellBlock, cellImage],
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
});
