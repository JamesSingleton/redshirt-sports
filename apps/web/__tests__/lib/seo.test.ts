import type { Metadata } from "next";

import { getSEOMetadata } from "@/lib/seo";

type TestOpenGraph = {
  type?: string;
  section?: string;
  authors?: string[];
  images?: Array<{ url?: string | URL; alt?: string }>;
};

function getOpenGraph(metadata: Metadata): TestOpenGraph {
  return (metadata.openGraph ?? {}) as TestOpenGraph;
}

function getFirstOgImage(metadata: Metadata) {
  const images = getOpenGraph(metadata).images;
  return Array.isArray(images) ? images[0] : images;
}

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlFor: () => ({
    size: () => ({
      url: () => "https://cdn.sanity.io/test-image.jpg",
    }),
  }),
}));

describe("getSEOMetadata", () => {
  it("returns default title and description when no data is provided", () => {
    const metadata = getSEOMetadata(null as never);

    expect(metadata.title).toBe(
      "College Sports News & Analysis at All Levels | Redshirt Sports",
    );
    expect(metadata.description).toContain("Redshirt Sports");
    expect(metadata.metadataBase?.toString()).toBe(
      "https://redshirtsports.com/",
    );
  });

  it("prefers seoTitle over title and ogTitle", () => {
    const metadata = getSEOMetadata({
      seoTitle: "SEO Title",
      ogTitle: "OG Title",
      title: "Page Title",
    });

    expect(metadata.title).toBe("SEO Title | Redshirt Sports");
    expect(metadata.openGraph?.title).toBe("SEO Title");
  });

  it("builds canonical URL from slug", () => {
    const metadata = getSEOMetadata({ slug: "about" });

    expect(metadata.alternates?.canonical).toBe(
      "https://redshirtsports.com/about",
    );
  });

  it("normalizes slug that already starts with a slash", () => {
    const metadata = getSEOMetadata({ slug: "/contact" });

    expect(metadata.alternates?.canonical).toBe(
      "https://redshirtsports.com/contact",
    );
  });

  it("uses author twitter handle when available", () => {
    const metadata = getSEOMetadata({
      authors: [
        { name: "Jane Doe", socialLinks: { twitter: "https://x.com/janedoe" } },
      ],
    });

    expect(metadata.twitter?.creator).toBe("@janedoe");
  });

  it("includes reading time in twitter metadata when provided", () => {
    const metadata = getSEOMetadata({ readingTime: 5 });

    expect(metadata.other).toEqual({
      "twitter:label1": "Reading time",
      "twitter:data1": "5 minutes",
    });
  });

  it("sets article open graph type and section when provided", () => {
    const metadata = getSEOMetadata({
      ogType: "article",
      articleSection: "College Football",
      authors: [{ name: "Jane Doe" }],
    });

    const openGraph = getOpenGraph(metadata);
    expect(openGraph.type).toBe("article");
    expect(openGraph.section).toBe("College Football");
    expect(openGraph.authors).toEqual(["Jane Doe"]);
  });

  it("resolves open graph images from Sanity assets", () => {
    const metadata = getSEOMetadata({
      seoImage: { asset: { _ref: "image-ref" }, alt: "SEO image" },
    });

    expect(getFirstOgImage(metadata)?.url).toBe(
      "https://cdn.sanity.io/test-image.jpg",
    );
    expect(getFirstOgImage(metadata)?.alt).toBe("SEO image");
  });

  it("falls back to defaultOpenGraphImage when no asset is present", () => {
    const metadata = getSEOMetadata({
      defaultOpenGraphImage: "https://example.com/default.jpg",
    });

    expect(getFirstOgImage(metadata)?.url).toBe(
      "https://example.com/default.jpg",
    );
  });

  it("prefers seoImage over ogImage and image", () => {
    const metadata = getSEOMetadata({
      seoImage: { asset: { _ref: "seo" }, alt: "SEO" },
      ogImage: { asset: { _ref: "og" }, alt: "OG" },
      image: { asset: { _ref: "main" }, alt: "Main" },
    });

    expect(getFirstOgImage(metadata)?.alt).toBe("SEO");
  });
});
