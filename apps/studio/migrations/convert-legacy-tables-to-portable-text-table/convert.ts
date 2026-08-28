type PortableTextSpan = {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
};

type PortableTextBlock = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: unknown[];
  children: PortableTextSpan[];
};

type LegacyTableRow = {
  _type?: string;
  _key: string;
  cells?: Array<string | null> | null;
};

type NativeTableCell = {
  _type: "cell";
  _key: string;
  value: PortableTextBlock[];
};

type NativeTableRow = {
  _type: "row";
  _key: string;
  cells: NativeTableCell[];
};

export type TableBlock = {
  _type: "table";
  _key: string;
  headerRows?: number;
  rows?: Array<LegacyTableRow | NativeTableRow | null> | null;
};

export type PortableTextValue = Array<
  TableBlock | ({ _type: string; _key: string } & Record<string, unknown>)
>;

export function isLegacyTableRow(row: unknown): row is LegacyTableRow {
  if (!row || typeof row !== "object") {
    return false;
  }

  if ("_type" in row && row._type === "tableRow") {
    return true;
  }

  if (!("cells" in row) || !Array.isArray(row.cells)) {
    return false;
  }

  const firstCell = row.cells.find((cell) => cell != null);
  return typeof firstCell === "string";
}

export function tableBlockHasLegacyRows(table: TableBlock): boolean {
  return (table.rows ?? []).some((row) => isLegacyTableRow(row));
}

export function portableTextHasLegacyTables(
  value: PortableTextValue | null | undefined,
): boolean {
  if (!value?.length) {
    return false;
  }

  return value.some(
    (block) => block._type === "table" && tableBlockHasLegacyRows(block),
  );
}

export function isNativeTableRow(row: unknown): row is NativeTableRow {
  return (
    !!row &&
    typeof row === "object" &&
    "_type" in row &&
    row._type === "row" &&
    "cells" in row &&
    Array.isArray(row.cells)
  );
}

export function tableBlockHasNativeRows(table: TableBlock): boolean {
  return (table.rows ?? []).some((row) => isNativeTableRow(row));
}

export function portableTextHasNativeTables(
  value: PortableTextValue | null | undefined,
): boolean {
  if (!value?.length) {
    return false;
  }

  return value.some(
    (block) => block._type === "table" && tableBlockHasNativeRows(block),
  );
}

function blocksToPlainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .filter(
      (block): block is PortableTextBlock =>
        !!block &&
        typeof block === "object" &&
        "_type" in block &&
        block._type === "block",
    )
    .flatMap((block) => block.children ?? [])
    .filter(
      (child): child is PortableTextSpan =>
        !!child &&
        typeof child === "object" &&
        "_type" in child &&
        child._type === "span",
    )
    .map((child) => child.text ?? "")
    .join("");
}

function stringToPortableTextBlock(
  text: string,
  keyPrefix: string,
): PortableTextBlock {
  return {
    _type: "block",
    _key: `${keyPrefix}-block`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `${keyPrefix}-span`,
        text,
        marks: [],
      },
    ],
  };
}

export function convertLegacyTableRow(row: LegacyTableRow): NativeTableRow {
  const rowKey = row._key || "row";
  const cells = (row.cells ?? [])
    .filter((cell): cell is string => cell != null)
    .map((text, index) => {
      const cellKey = `${rowKey}-cell-${index}`;
      return {
        _type: "cell" as const,
        _key: cellKey,
        value: text ? [stringToPortableTextBlock(text, cellKey)] : [],
      };
    });

  return {
    _type: "row",
    _key: rowKey,
    cells,
  };
}

export function convertTableBlock(table: TableBlock): TableBlock {
  if (!tableBlockHasLegacyRows(table)) {
    return table;
  }

  return {
    ...table,
    // Legacy @sanity/table always rendered the first row as a header.
    headerRows: table.headerRows ?? 1,
    rows: (table.rows ?? [])
      .filter((row): row is LegacyTableRow | NativeTableRow => row != null)
      .map((row) =>
        isLegacyTableRow(row) ? convertLegacyTableRow(row) : row,
      ),
  };
}

export function convertPortableTextValue(
  value: PortableTextValue | null | undefined,
): PortableTextValue | null | undefined {
  if (!value?.length) {
    return value;
  }

  let changed = false;
  const nextValue = value.map((block) => {
    if (block._type !== "table") {
      return block;
    }

    const nextTable = convertTableBlock(block);
    if (nextTable !== block) {
      changed = true;
    }
    return nextTable;
  });

  return changed ? nextValue : value;
}

/** Restore @sanity/table shape for prod until native table rendering is deployed. */
export function convertNativeTableRowToLegacy(row: NativeTableRow): LegacyTableRow {
  return {
    _type: "tableRow",
    _key: row._key,
    cells: (row.cells ?? []).map((cell) => blocksToPlainText(cell?.value)),
  };
}

export function revertTableBlock(table: TableBlock): TableBlock {
  if (!tableBlockHasNativeRows(table)) {
    return table;
  }

  const { headerRows: _headerRows, ...rest } = table;

  return {
    ...rest,
    rows: (table.rows ?? [])
      .filter((row): row is LegacyTableRow | NativeTableRow => row != null)
      .map((row) =>
        isNativeTableRow(row) ? convertNativeTableRowToLegacy(row) : row,
      ),
  };
}

export function revertPortableTextValue(
  value: PortableTextValue | null | undefined,
): PortableTextValue | null | undefined {
  if (!value?.length) {
    return value;
  }

  let changed = false;
  const nextValue = value.map((block) => {
    if (block._type !== "table") {
      return block;
    }

    const nextTable = revertTableBlock(block);
    if (nextTable !== block) {
      changed = true;
    }
    return nextTable;
  });

  return changed ? nextValue : value;
}
