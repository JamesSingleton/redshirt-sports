/**
 * Turns the export frame into a PNG by rendering its DOM, so the image is the
 * bracket as the page draws it. The library is loaded on first use to keep it
 * out of the page bundle.
 */
export async function captureBracketImage(node: HTMLElement): Promise<Blob> {
  await document.fonts?.ready;
  const { domToBlob } = await import("modern-screenshot");
  return domToBlob(node, { scale: 2, backgroundColor: "#ffffff" });
}
