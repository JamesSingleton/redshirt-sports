import { render, screen } from "@testing-library/react";

import SanityImage, { IMAGE_SIZES } from "@/components/sanity-image";

const { mockProcessImageData } = vi.hoisted(() => ({
  mockProcessImageData: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/image", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@redshirt-sports/sanity/image")>();
  return {
    ...actual,
    processImageData: mockProcessImageData,
  };
});

vi.mock("sanity-image", () => ({
  SanityImage: ({
    alt,
    width,
    height,
    loading,
    fetchPriority,
    className,
  }: {
    alt?: string;
    width?: number;
    height?: number;
    loading?: string;
    fetchPriority?: string;
    className?: string;
  }) => (
    <img
      alt={alt ?? ""}
      width={width}
      height={height}
      data-loading={loading}
      data-fetch-priority={fetchPriority}
      className={className}
      data-testid="sanity-image"
    />
  ),
}));

describe("SanityImage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockProcessImageData.mockReset();
  });

  it("exports image size constants", () => {
    expect(IMAGE_SIZES.articleCard).toContain("100vw");
  });

  it("returns null for an empty string source", () => {
    const { container } = render(<SanityImage image="" alt="empty" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a plain img tag for string sources", () => {
    render(
      <SanityImage
        image="https://example.com/image.jpg"
        alt="Example"
        width={100}
        height={80}
        priority
        sizes="100vw"
      />,
    );

    const img = screen.getByRole("img", { name: "Example" });
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  it("renders string sources without alt text or priority hints", () => {
    render(
      <SanityImage
        image="https://example.com/plain.jpg"
        width={120}
        height={90}
        loading="lazy"
      />,
    );

    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("fetchpriority");
  });

  it("returns null when processed image data is missing", () => {
    mockProcessImageData.mockReturnValue(null);
    const { container } = render(
      <SanityImage image={{ asset: { _ref: "missing" } } as never} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Sanity image wrapper for object sources", () => {
    mockProcessImageData.mockReturnValue({
      id: "image-1",
      alt: "Processed alt",
      width: 400,
      height: 300,
    });

    render(
      <SanityImage
        image={{ asset: { _ref: "image-1" } } as never}
        quality={90}
        className="rounded"
      />,
    );

    expect(screen.getByTestId("sanity-image")).toHaveAttribute(
      "alt",
      "Processed alt",
    );
  });

  it("renders the Sanity image wrapper with priority loading", () => {
    mockProcessImageData.mockReturnValue({
      id: "image-3",
      alt: "Priority alt",
      width: 400,
      height: 300,
    });

    render(
      <SanityImage
        image={{ asset: { _ref: "image-3" } } as never}
        priority
        loading="lazy"
      />,
    );

    const img = screen.getByTestId("sanity-image");
    expect(img).toHaveAttribute("data-loading", "eager");
    expect(img).toHaveAttribute("data-fetch-priority", "high");
  });

  it("warns in development when alt text is missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockProcessImageData.mockReturnValue({
      id: "image-2",
      alt: "",
      width: 200,
      height: 100,
    });

    render(<SanityImage image={{ asset: { _ref: "image-2" } } as never} />);

    expect(warnSpy).toHaveBeenCalledWith(
      "[SanityImage] Missing alt text for image: image-2",
    );
    warnSpy.mockRestore();
  });
});
