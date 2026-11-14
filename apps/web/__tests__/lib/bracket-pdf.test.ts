import { jpegToPdf } from "@/lib/bracket-pdf";

async function text(blob: Blob) {
  return new TextDecoder("latin1").decode(await blob.arrayBuffer());
}

describe("jpegToPdf", () => {
  it("writes one landscape Letter page holding the image", async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
    const blob = jpegToPdf(jpeg, 2000, 1000);
    expect(blob.type).toBe("application/pdf");
    const pdf = await text(blob);

    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf.endsWith("%%EOF\n")).toBe(true);
    expect(pdf).toContain("/MediaBox [0 0 792 612]");
    expect(pdf).toContain(
      "/Width 2000 /Height 1000 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length 9",
    );
    // Wide image: fills the width inside 0.4in margins, centred vertically.
    expect(pdf).toContain("q 734.4 0 0 367.2 28.8 122.4 cm /Im0 Do Q");
    // The JPEG bytes go in untouched.
    expect(pdf).toContain(new TextDecoder("latin1").decode(jpeg));
  });

  it("fits a tall image to the height", async () => {
    const pdf = await text(jpegToPdf(new Uint8Array([1]), 500, 1000));
    expect(pdf).toContain("q 277.2 0 0 554.4 257.4 28.8 cm /Im0 Do Q");
  });

  it("points the cross-reference table at every object", async () => {
    const pdf = await text(jpegToPdf(new Uint8Array([7, 7, 7]), 10, 10));
    const xref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
    expect(pdf.slice(xref).startsWith("xref\n0 6\n")).toBe(true);
    const offsets = [...pdf.slice(xref).matchAll(/(\d{10}) 00000 n/g)].map(
      (match) => Number(match[1]),
    );
    expect(offsets).toHaveLength(5);
    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
  });
});
