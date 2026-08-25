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
  cells?: PtTableCellValue[] | null;
}

/** Native Sanity Portable Text table (nested cell rich text). */
export interface PtTableBlockValue {
  _type: "table";
  _key?: string;
  headerRows?: number | null;
  rows?: PtTableRowValue[] | null;
}

/** Legacy @sanity/table shape (plain string cells). */
export interface LegacyTableBlockValue {
  _type: "table";
  _key?: string;
  rows: {
    _key: string;
    _type?: string;
    cells: string[];
  }[];
}

export type TableBlockValue = PtTableBlockValue | LegacyTableBlockValue;

function isLegacyStringCellTable(
  value: TableBlockValue,
): value is LegacyTableBlockValue {
  const firstCell = value.rows?.[0]?.cells?.[0];
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
  return (
    <TableRow>
      {(row.cells ?? []).map((cell) => (
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
  const headerRow = value.rows[0];
  const rows = value.rows.slice(1);

  return (
    <div className="not-prose">
      <Table>
        <TableHeader>
          <TableRow>
            {headerRow?.cells.map((cell) => (
              <TableHead key={cell}>{cell}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._key}>
              {row.cells.map((cell) => (
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

  const headerRowCount = Math.max(0, value.headerRows ?? 0);
  const headRows = value.rows.slice(0, headerRowCount);
  const bodyRows = value.rows.slice(headerRowCount);

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
