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
  type PortableTextComponents,
} from "next-sanity";

type TableValue = {
  _type: "table";
  headerRows?: number;
  rows?: {
    _key: string;
    cells?: { _key: string; value?: PortableTextBlock[] }[];
  }[];
};
const cellComponents: PortableTextComponents = {
  // Avoid wrapping every cell's text in a <p>
  block: { normal: ({ children }) => <>{children}</> },
};

export function PortableTable({ value }: { value: TableValue }) {
  const rows = value.rows ?? [];
  if (rows.length === 0) return null;

  const headerCount = Math.max(0, value.headerRows ?? 0);
  const headerRows = rows.slice(0, headerCount);
  const bodyRows = rows.slice(headerCount);

  return (
    <div className="not-prose my-6 w-full max-w-full overflow-x-auto overflow-y-clip overscroll-x-contain rounded-md border">
      <Table>
        {headerRows.length > 0 && (
          <TableHeader className="bg-muted">
            {headerRows.map((row) => (
              <TableRow key={row._key}>
                {row.cells?.map((cell) => (
                  <TableHead key={cell._key} scope="col">
                    <PortableText
                      components={cellComponents}
                      value={cell.value ?? []}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {bodyRows.map((row) => (
            <TableRow key={row._key}>
              {row.cells?.map((cell) => (
                <TableCell key={cell._key}>
                  <PortableText
                    components={cellComponents}
                    value={cell.value ?? []}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
