import { crc32, inflateRawSync } from "node:zlib";

import { weekModel } from "@/__tests__/helpers/ratings-fixtures";
import { ratingsSeasonWorkbook } from "@/lib/ratings/export";
import { buildWorkbook, sheetName } from "@/lib/ratings/xlsx";

/** Read every file back out of the zip and check each CRC. */
function unzip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map<string, string>();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const crc = view.getUint32(offset + 14, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = new TextDecoder().decode(
      bytes.slice(offset + 30, offset + 30 + nameLength),
    );
    const start = offset + 30 + nameLength;
    const data = inflateRawSync(bytes.slice(start, start + size));
    expect(crc32(data)).toBe(crc);
    files.set(name, new TextDecoder().decode(data));
    offset = start + size;
  }
  return files;
}

describe("xlsx writer", () => {
  it("writes a valid workbook with sheets, typed cells, escaping, widths, and a frozen bold header", () => {
    const files = unzip(
      buildWorkbook([
        {
          name: "Week 9",
          rows: [
            ["Team", "Power", "Ranked"],
            ["A & <B>", 22.8, true],
            ["C", Number.NaN, false],
            [null, "", 3],
          ],
          widths: [20, 8],
        },
        { name: "About", rows: [["Term"]] },
      ]),
    );
    expect([...files.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
      "xl/worksheets/sheet2.xml",
    ]);
    expect(files.get("xl/workbook.xml")).toContain(
      '<sheet name="Week 9" sheetId="1" r:id="rId1"/>',
    );
    expect(files.get("xl/_rels/workbook.xml.rels")).toContain('Id="rId3"');
    const sheet = files.get("xl/worksheets/sheet1.xml") ?? "";
    expect(sheet).toContain('<c r="A1" t="inlineStr" s="1">');
    expect(sheet).toContain("A &amp; &lt;B&gt;");
    expect(sheet).toContain('<c r="B2"><v>22.8</v></c>');
    expect(sheet).toContain('<c r="C2" t="b"><v>1</v></c>');
    expect(sheet).toContain('<c r="C3" t="b"><v>0</v></c>');
    expect(sheet).not.toContain('r="B3"');
    expect(sheet).not.toContain('r="A4"');
    expect(sheet).toContain('state="frozen"');
    expect(sheet).toContain(
      '<col min="1" max="1" width="20" customWidth="1"/>',
    );
    expect(files.get("xl/worksheets/sheet2.xml")).not.toContain("<cols>");
  });

  it("names columns past Z and cleans sheet names", () => {
    const row = Array.from({ length: 28 }, (_, i) => i);
    const sheet = unzip(buildWorkbook([{ name: "x", rows: [row] }])).get(
      "xl/worksheets/sheet1.xml",
    );
    expect(sheet).toContain('r="AB1"');
    expect(sheetName('Week [9]: "a/b"?')).toBe('Week  9   "a b" ');
    expect(sheetName("x".repeat(40))).toHaveLength(31);
  });
});

describe("season workbook", () => {
  it("has a sheet per week, newest first, then an About sheet with the license and checksums", () => {
    const model = weekModel();
    const files = unzip(
      ratingsSeasonWorkbook(
        {
          pool: model.pool,
          weeks: [
            { week: model.weeks[1]!, run: model.run, rows: model.rows },
            { week: model.weeks[0]!, run: model.run, rows: model.rows },
          ],
        },
        "https://x.test/college/football/ratings/fcs",
      ),
    );
    const workbook = files.get("xl/workbook.xml") ?? "";
    expect(workbook.indexOf('name="Postseason"')).toBeLessThan(
      workbook.indexOf('name="Week 16"'),
    );
    expect(workbook).toContain('name="About"');
    const week = files.get("xl/worksheets/sheet1.xml") ?? "";
    expect(week).toContain("vs FCS");
    expect(week).toContain("Montana State");
    expect(week).toContain(">yes<");
    const about = files.get("xl/worksheets/sheet3.xml") ?? "";
    expect(about).toContain("creativecommons.org");
    expect(about).toContain("Only games between two FCS teams");
    expect(about).toContain("abcdef0123456789");
  });
});
