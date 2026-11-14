import { jpegToPdf } from "@/lib/bracket-pdf";

const OPTIONS = { scale: 2, backgroundColor: "#ffffff" } as const;

/** modern-screenshot, loaded on first use to keep it out of the page bundle. */
async function screenshot() {
  await document.fonts?.ready;
  return import("modern-screenshot");
}

/**
 * Turns the export frame into a PNG by rendering its DOM, so the image is the
 * bracket as the page draws it.
 */
export async function captureBracketImage(node: HTMLElement): Promise<Blob> {
  const { domToBlob } = await screenshot();
  return domToBlob(node, OPTIONS);
}

/** The same render as a one-page landscape PDF. */
export async function captureBracketPdf(node: HTMLElement): Promise<Blob> {
  const { domToCanvas } = await screenshot();
  const canvas = await domToCanvas(node, OPTIONS);
  const jpeg = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No JPEG"))),
      "image/jpeg",
      0.92,
    ),
  );
  return jpegToPdf(
    new Uint8Array(await jpeg.arrayBuffer()),
    canvas.width,
    canvas.height,
  );
}
