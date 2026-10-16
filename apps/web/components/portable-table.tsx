import { PortableText, type PortableTextComponents } from "@portabletext/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";

import { marks } from "./rich-text";
import { SanityImage } from "./sanity-image";

// Cells only allow simple text, links, and a small image (see the Studio schema).
// Paragraphs render as spans so shadcn cells don't pick up <p> margins.
const cellComponents: PortableTextComponents = {
  marks,
  block: {
    normal: ({ children }) => <span className="block">{children}</span>,
  },
  types: {
    image: ({ value }) =>
      value?.asset ? (
        <SanityImage
          image={value}
          alt={value.caption ?? ""} // "caption" holds alt text
          width={80}
          height={80}
          className="max-h-16 w-auto object-contain"
        />
      ) : null,
  },
};

type CellValue = {
  _key: string;
  value?: any[];
};

type RowValue = {
  _key: string;
  cells?: CellValue[];
};

type TableValue = {
  headerRows?: number;
  rows?: RowValue[];
};

export function PortableTable({ value }: { value: TableValue }) {
  const rows = value?.rows ?? [];
  if (rows.length === 0) return null;

  const headerCount = Math.max(0, value.headerRows ?? 0);
  const headerRows = rows.slice(0, headerCount);
  const bodyRows = rows.slice(headerCount);

  return (
    <div className="not-prose my-6 w-full overflow-x-auto rounded-md border">
      <Table>
        {headerRows.length > 0 && (
          <TableHeader>
            {headerRows.map((row) => (
              <TableRow key={row._key}>
                {row.cells?.map((cell) => (
                  <TableHead key={cell._key}>
                    <PortableText
                      value={cell.value ?? []}
                      components={cellComponents}
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
                    value={cell.value ?? []}
                    components={cellComponents}
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
