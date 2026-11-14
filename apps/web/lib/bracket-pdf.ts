/** US Letter in landscape, in PDF points (1/72 inch). */
const PAGE = { width: 792, height: 612 };
/** 0.4 inch, the same margin as the print stylesheet. */
const MARGIN = 28.8;

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * A one-page PDF holding a single JPEG, scaled to fit a landscape Letter page
 * inside the margins and centred. It is written by hand because the file is
 * that simple: a catalog, one page, the image and the line that draws it.
 * Works in any browser, unlike `window.print()`, which most phones ignore.
 */
export function jpegToPdf(jpeg: Uint8Array, width: number, height: number) {
  const scale = Math.min(
    (PAGE.width - MARGIN * 2) / width,
    (PAGE.height - MARGIN * 2) / height,
  );
  const drawWidth = round(width * scale);
  const drawHeight = round(height * scale);
  const x = round((PAGE.width - drawWidth) / 2);
  const y = round((PAGE.height - drawHeight) / 2);
  const draw = `q ${drawWidth} 0 0 ${drawHeight} ${x} ${y} cm /Im0 Do Q`;

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: Uint8Array | string) => {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (body: string, stream?: Uint8Array) => {
    offsets.push(length);
    push(`${offsets.length} 0 obj\n${body}\n`);
    if (stream) {
      push("stream\n");
      push(stream);
      push("\nendstream\n");
    }
    push("endobj\n");
  };

  push("%PDF-1.4\n");
  object("<< /Type /Catalog /Pages 2 0 R >>");
  object("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  object(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,
    jpeg,
  );
  const content = encoder.encode(draw);
  object(`<< /Length ${content.length} >>`, content);

  const xref = length;
  push(
    `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${offsets
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
      .join("")}`,
  );
  push(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}
