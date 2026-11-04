import { renderToString } from "react-dom/server";

import SanityImage from "@/components/sanity-image";

const { mockProcessImageData } = vi.hoisted(() => ({
  mockProcessImageData: vi.fn(),
}));

// The real sanity-image library renders here; only the Sanity data is faked.
vi.mock("@redshirt-sports/sanity/image", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@redshirt-sports/sanity/image")>();
  return { ...actual, processImageData: mockProcessImageData };
});

const caption = "No. 8 North Dakota visits No. 4 Youngstown State";

function serverHtmlImages(preview?: string) {
  mockProcessImageData.mockReturnValue({
    id: "image-abc123-1920x1080-jpg",
    alt: caption,
    width: 1920,
    height: 1080,
    ...(preview ? { preview } : {}),
  });
  const html = renderToString(
    <SanityImage image={{ asset: { _ref: "image-abc123-1920x1080-jpg" } }} />,
  );
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("img")];
}

describe("SanityImage alt text in server HTML", () => {
  it("puts the alt on the real image, not the blur placeholder", () => {
    const [placeholder, image] = serverHtmlImages("data:image/jpeg;base64,AAA");

    expect(placeholder).toHaveAttribute("data-lqip");
    expect(placeholder).toHaveAttribute("alt", "");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(image).toHaveAttribute("alt", caption);
    expect(image).not.toHaveAttribute("data-alt");
  });

  it("keeps the alt on images without a placeholder", () => {
    const images = serverHtmlImages();

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("alt", caption);
  });
});
