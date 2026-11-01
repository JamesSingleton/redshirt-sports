import { render, screen } from "@testing-library/react";

import SanityImage, {
  IMAGE_SIZES,
  renderSize,
} from "@/components/sanity-image";

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
  SanityImage: (props: {
    alt?: string;
    width?: number;
    height?: number;
    loading?: string;
    fetchPriority?: string;
    className?: string;
  }) => (
    <img
      alt={props.alt ?? ""}
      width={props.width}
      height={props.height}
      data-loading={props.loading}
      // sanity-image defaults to lazy only when no `loading` key is passed.
      data-has-loading-key={String(Object.hasOwn(props, "loading"))}
      data-fetch-priority={props.fetchPriority}
      className={props.className}
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

  it("defaults plain img sources to lazy loading", () => {
    render(<SanityImage image="https://example.com/x.jpg" alt="X" />);
    expect(screen.getByRole("img", { name: "X" })).toHaveAttribute(
      "loading",
      "lazy",
    );
  });

  it("leaves loading to sanity-image's lazy default when not set", () => {
    mockProcessImageData.mockReturnValue({
      id: "image-4",
      alt: "Logo",
      width: 1000,
      height: 1000,
    });

    render(<SanityImage image={{ asset: { _ref: "image-4" } } as never} />);

    expect(screen.getByTestId("sanity-image")).toHaveAttribute(
      "data-has-loading-key",
      "false",
    );
  });

  it("passes an explicit loading value through", () => {
    mockProcessImageData.mockReturnValue({ id: "image-5", alt: "A" });

    render(
      <SanityImage
        image={{ asset: { _ref: "image-5" } } as never}
        loading="eager"
      />,
    );

    expect(screen.getByTestId("sanity-image")).toHaveAttribute(
      "data-loading",
      "eager",
    );
  });

  it("renders at the requested size, not the asset's original size", () => {
    mockProcessImageData.mockReturnValue({
      id: "image-6",
      alt: "School",
      width: 1000,
      height: 1000,
    });

    render(
      <SanityImage
        image={{ asset: { _ref: "image-6" } } as never}
        width={32}
        height={32}
      />,
    );

    const img = screen.getByTestId("sanity-image");
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("height", "32");
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

describe("renderSize", () => {
  it("keeps both requested sides", () => {
    expect(renderSize(32, 32, 1000, 500)).toEqual({ width: 32, height: 32 });
  });

  it("derives the missing side from the asset ratio", () => {
    expect(renderSize(200, undefined, 1000, 500)).toEqual({
      width: 200,
      height: 100,
    });
    expect(renderSize(undefined, 100, 1000, 500)).toEqual({
      width: 200,
      height: 100,
    });
  });

  it("keeps a single side when the asset ratio is unknown", () => {
    expect(renderSize(200, undefined, undefined, undefined)).toEqual({
      width: 200,
    });
    expect(renderSize(undefined, 100, 1000, undefined)).toEqual({
      height: 100,
    });
  });

  it("falls back to the asset size when nothing is requested", () => {
    expect(renderSize(undefined, undefined, 1000, 500)).toEqual({
      width: 1000,
      height: 500,
    });
    expect(renderSize(undefined, undefined, undefined, undefined)).toEqual({});
  });
});
