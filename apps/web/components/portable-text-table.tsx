import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextReactComponents,
} from "next-sanity";

export interface PtTableCellValue {
  _key: string;
  value?: PortableTextBlock[] | null;
}

export interface PtTableRowValue {
  _key: string;
  cells?: Array<PtTableCellValue | null> | null;
}

/** Native Sanity Portable Text table (nested cell rich text). */
export interface PtTableBlockValue {
  _type: "table";
  _key?: string;
  headerRows?: number | null;
  rows?: Array<PtTableRowValue | null> | null;
}

/** Legacy @sanity/table shape (plain string cells). */
export interface LegacyTableBlockValue {
  _type: "table";
  _key?: string;
  rows: Array<{
    _key: string;
    _type?: string;
    cells: Array<string | null>;
  } | null>;
}

export type TableBlockValue = PtTableBlockValue | LegacyTableBlockValue;

function isLegacyStringCellTable(
  value: TableBlockValue,
): value is LegacyTableBlockValue {
  const firstCell = value.rows
    ?.find(Boolean)
    ?.cells?.find((cell) => cell != null);
  return typeof firstCell === "string";
}

function PtTableCell({
  cell,
  isHeader,
  cellComponents,
}: Readonly<{
  cell: PtTableCellValue;
  isHeader: boolean;
  cellComponents: Partial<PortableTextReactComponents>;
}>) {
  const CellTag = isHeader ? TableHead : TableCell;
  return (
    <CellTag className="align-top" scope={isHeader ? "col" : undefined}>
      {Array.isArray(cell.value) ? (
        <PortableText components={cellComponents} value={cell.value} />
      ) : null}
    </CellTag>
  );
}

function PtTableRow({
  row,
  isHeader,
  cellComponents,
}: Readonly<{
  row: PtTableRowValue;
  isHeader: boolean;
  cellComponents: Partial<PortableTextReactComponents>;
}>) {
  const cells = (row.cells ?? []).filter(
    (cell): cell is PtTableCellValue => cell != null && Boolean(cell._key),
  );

  return (
    <TableRow>
      {cells.map((cell) => (
        <PtTableCell
          cell={cell}
          cellComponents={cellComponents}
          isHeader={isHeader}
          key={cell._key}
        />
      ))}
    </TableRow>
  );
}

function LegacyStringTable({ value }: { value: LegacyTableBlockValue }) {
  const rows = value.rows.filter(
    (row): row is NonNullable<(typeof value.rows)[number]> =>
      row != null && Boolean(row._key),
  );
  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  return (
    <div className="not-prose">
      <Table>
        <TableHeader>
          <TableRow>
            {(headerRow?.cells ?? [])
              .filter((cell): cell is string => cell != null)
              .map((cell) => (
                <TableHead key={cell}>{cell}</TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bodyRows.map((row) => (
            <TableRow key={row._key}>
              {(row.cells ?? [])
                .filter((cell): cell is string => cell != null)
                .map((cell) => (
                  <TableCell key={cell}>{cell}</TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TableBlock({
  value,
  cellComponents,
}: Readonly<{
  value: TableBlockValue;
  cellComponents: Partial<PortableTextReactComponents>;
}>) {
  if (!Array.isArray(value.rows) || value.rows.length === 0) {
    return null;
  }

  if (isLegacyStringCellTable(value)) {
    return <LegacyStringTable value={value} />;
  }

  const rows = value.rows.filter(
    (row): row is PtTableRowValue => row != null && Boolean(row._key),
  );
  if (rows.length === 0) {
    return null;
  }

  const headerRowCount = Math.max(0, value.headerRows ?? 0);
  const headRows = rows.slice(0, headerRowCount);
  const bodyRows = rows.slice(headerRowCount);

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <Table>
        {headRows.length > 0 ? (
          <TableHeader>
            {headRows.map((row) => (
              <PtTableRow
                cellComponents={cellComponents}
                isHeader
                key={row._key}
                row={row}
              />
            ))}
          </TableHeader>
        ) : null}
        <TableBody>
          {bodyRows.map((row) => (
            <PtTableRow
              cellComponents={cellComponents}
              isHeader={false}
              key={row._key}
              row={row}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
