import { describe, expect, it } from "vitest";

import {
  convertLegacyTableRow,
  convertPortableTextValue,
  convertTableBlock,
  isLegacyTableRow,
  portableTextHasLegacyTables,
  revertPortableTextValue,
  tableBlockHasLegacyRows,
} from "./convert";

describe("legacy table migration", () => {
  it("detects legacy table rows by _type or string cells", () => {
    expect(
      isLegacyTableRow({ _type: "tableRow", _key: "r1", cells: ["A"] }),
    ).toBe(true);
    expect(isLegacyTableRow({ _key: "r1", cells: ["A", "B"] })).toBe(true);
    expect(
      isLegacyTableRow({
        _type: "row",
        _key: "r1",
        cells: [{ _type: "cell", _key: "c1", value: [] }],
      }),
    ).toBe(false);
  });

  it("converts legacy rows to native row/cell/value blocks", () => {
    const converted = convertLegacyTableRow({
      _type: "tableRow",
      _key: "header",
      cells: ["Team", "Rank"],
    });

    expect(converted).toEqual({
      _type: "row",
      _key: "header",
      cells: [
        {
          _type: "cell",
          _key: "header-cell-0",
          value: [
            {
              _type: "block",
              _key: "header-cell-0-block",
              style: "normal",
              markDefs: [],
              children: [
                {
                  _type: "span",
                  _key: "header-cell-0-span",
                  text: "Team",
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          _type: "cell",
          _key: "header-cell-1",
          value: [
            {
              _type: "block",
              _key: "header-cell-1-block",
              style: "normal",
              markDefs: [],
              children: [
                {
                  _type: "span",
                  _key: "header-cell-1-span",
                  text: "Rank",
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("sets headerRows when migrating a legacy table block", () => {
    const converted = convertTableBlock({
      _type: "table",
      _key: "table-1",
      rows: [
        { _type: "tableRow", _key: "h", cells: ["Team"] },
        { _type: "tableRow", _key: "r1", cells: ["Alabama"] },
      ],
    });

    expect(converted.headerRows).toBe(1);
    expect(converted.rows?.every((row) => row?._type === "row")).toBe(true);
  });

  it("leaves native tables unchanged", () => {
    const nativeTable = {
      _type: "table" as const,
      _key: "native",
      headerRows: 1,
      rows: [
        {
          _type: "row" as const,
          _key: "r1",
          cells: [
            {
              _type: "cell" as const,
              _key: "c1",
              value: [
                {
                  _type: "block" as const,
                  _key: "b1",
                  style: "normal",
                  markDefs: [],
                  children: [
                    {
                      _type: "span" as const,
                      _key: "s1",
                      text: "Native",
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    expect(tableBlockHasLegacyRows(nativeTable)).toBe(false);
    expect(convertTableBlock(nativeTable)).toBe(nativeTable);
  });

  it("converts legacy tables inside portable text arrays", () => {
    const body = [
      {
        _type: "block",
        _key: "intro",
        style: "normal",
        markDefs: [],
        children: [],
      },
      {
        _type: "table",
        _key: "table-1",
        rows: [{ _type: "tableRow", _key: "r1", cells: ["Value"] }],
      },
    ];

    expect(portableTextHasLegacyTables(body)).toBe(true);

    const converted = convertPortableTextValue(body);
    expect(converted?.[1]).toMatchObject({
      _type: "table",
      headerRows: 1,
      rows: [{ _type: "row", _key: "r1" }],
    });
  });

  it("reverts native tables back to legacy tableRow string cells", () => {
    const nativeTable = {
      _type: "table" as const,
      _key: "table-1",
      headerRows: 1,
      rows: [
        {
          _type: "row" as const,
          _key: "header",
          cells: [
            {
              _type: "cell" as const,
              _key: "header-cell-0",
              value: [
                {
                  _type: "block" as const,
                  _key: "header-cell-0-block",
                  style: "normal",
                  markDefs: [],
                  children: [
                    {
                      _type: "span" as const,
                      _key: "header-cell-0-span",
                      text: "Team",
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const reverted = revertPortableTextValue([nativeTable]);
    expect(reverted?.[0]).toEqual({
      _type: "table",
      _key: "table-1",
      rows: [
        {
          _type: "tableRow",
          _key: "header",
          cells: ["Team"],
        },
      ],
    });
  });

  it("round-trips legacy → native → legacy", () => {
    const legacyBody = [
      {
        _type: "table" as const,
        _key: "t1",
        rows: [
          {
            _type: "tableRow" as const,
            _key: "r1",
            cells: ["A", "B"],
          },
        ],
      },
    ];

    const native = convertPortableTextValue(legacyBody);
    const legacyAgain = revertPortableTextValue(native);
    expect(legacyAgain?.[0]).toEqual(legacyBody[0]);
  });
});
