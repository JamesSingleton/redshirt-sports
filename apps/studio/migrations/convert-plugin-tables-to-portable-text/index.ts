import { at, defineMigration, set } from "sanity/migrate";

type RecordValue = Record<string, unknown>;

const legacyTableFilter =
  'count(body[_type == "table" && count(rows[_type == "tableRow"]) > 0]) > 0';
const selectedDocumentId = process.env.SANITY_MIGRATION_DOCUMENT_ID?.replace(
  /^drafts\./,
  "",
);
const documentFilter = selectedDocumentId
  ? `_id in [${JSON.stringify(selectedDocumentId)}, ${JSON.stringify(`drafts.${selectedDocumentId}`)}] && ${legacyTableFilter}`
  : legacyTableFilter;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function portableTextValue(text: string, rowIndex: number, cellIndex: number) {
  const key = `row-${rowIndex}-cell-${cellIndex}`;
  return text === ""
    ? []
    : [
        {
          _key: `${key}-block`,
          _type: "block",
          children: [
            {
              _key: `${key}-span`,
              _type: "span",
              marks: [],
              text,
            },
          ],
          markDefs: [],
          style: "normal",
        },
      ];
}

function convertTable(table: RecordValue) {
  if (!Array.isArray(table.rows)) return table;

  let changed = false;
  const rows = table.rows.map((row, rowIndex) => {
    if (!isRecord(row) || row._type !== "tableRow") return row;
    if (!Array.isArray(row.cells)) {
      throw new Error(`Legacy table row ${rowIndex} has no cells array`);
    }

    const cells = row.cells.map((cell, cellIndex) => {
      if (typeof cell !== "string") {
        throw new Error(
          `Legacy table cell at row ${rowIndex}, column ${cellIndex} is not text`,
        );
      }

      return {
        _key: `row-${rowIndex}-cell-${cellIndex}`,
        _type: "cell",
        value: portableTextValue(cell, rowIndex, cellIndex),
      };
    });

    changed = true;
    return { ...row, _type: "row", cells };
  });

  if (!changed) return table;
  return {
    ...table,
    headerRows: typeof table.headerRows === "number" ? table.headerRows : 1,
    rows,
  };
}

export default defineMigration({
  title: "Convert @sanity/table blocks to built in Portable Text tables",
  documentTypes: ["legal", "post"],
  filter: documentFilter,
  migrate: {
    document(document) {
      if (!Array.isArray(document.body)) return [];

      const body = document.body.map((block) =>
        isRecord(block) && block._type === "table"
          ? convertTable(block)
          : block,
      );

      return at("body", set(body));
    },
  },
});
