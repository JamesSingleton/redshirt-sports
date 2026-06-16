import type { Metadata } from "next";

import {
  DEFAULT_META_TITLE,
  getRootMetadata,
  getSEOMetadata,
  OG_COUNTRY_NAME,
  OG_LOCALE,
  SITE_BRAND,
} from "@/lib/seo";

type TestOpenGraph = {
  type?: string;
  section?: string;
  authors?: string[];
  images?: Array<{ url?: string | URL; alt?: string }>;
  locale?: string;
  countryName?: string;
  siteName?: string;
  url?: string | URL;
  title?: string;
  description?: string;
  publishedTime?: string;
  modifiedTime?: string;
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

describe("getRootMetadata", () => {
  it("exports site-wide Open Graph defaults", () => {
    const metadata = getRootMetadata();
    const openGraph = getOpenGraph(metadata);

    expect(metadata.metadataBase?.toString()).toBe(
      "https://redshirtsports.com/",
    );
    expect(metadata.title).toEqual({
      default: DEFAULT_META_TITLE,
      template: `%s | ${SITE_BRAND}`,
    });
    expect(openGraph.type).toBe("website");
    expect(openGraph.siteName).toBe(SITE_BRAND);
    expect(openGraph.locale).toBe(OG_LOCALE);
    expect(openGraph.countryName).toBe(OG_COUNTRY_NAME);
    expect(openGraph.url).toBe("https://redshirtsports.com");
    expect(openGraph.title).toBe(DEFAULT_META_TITLE);
    expect(openGraph.description).toContain("Redshirt Sports");
  });
});

describe("getSEOMetadata", () => {
  it("returns default title and description when no data is provided", () => {
    const metadata = getSEOMetadata(null as never);

    expect(metadata.title).toBe(DEFAULT_META_TITLE);
    expect(metadata.description).toContain("Redshirt Sports");
    expect(getOpenGraph(metadata).title).toBe(
      `${DEFAULT_META_TITLE} | ${SITE_BRAND}`,
    );
  });

  it("prefers seoTitle over title and ogTitle", () => {
    const metadata = getSEOMetadata({
      seoTitle: "SEO Title",
      ogTitle: "OG Title",
      title: "Page Title",
    });

    expect(metadata.title).toBe("SEO Title");
    expect(getOpenGraph(metadata).title).toBe(`SEO Title | ${SITE_BRAND}`);
  });

  it("includes required Open Graph fields", () => {
    const metadata = getSEOMetadata({ slug: "about" });
    const openGraph = getOpenGraph(metadata);

    expect(openGraph.type).toBe("website");
    expect(openGraph.siteName).toBe(SITE_BRAND);
    expect(openGraph.locale).toBe(OG_LOCALE);
    expect(openGraph.countryName).toBe(OG_COUNTRY_NAME);
    expect(openGraph.url).toBe("https://redshirtsports.com/about");
    expect(openGraph.title).toBeTruthy();
    expect(openGraph.description).toBeTruthy();
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

  it("includes article twitter labels for author and reading time", () => {
    const metadata = getSEOMetadata({
      ogType: "article",
      authors: [{ name: "Jane Doe" }],
      readingTime: 5,
    });

    expect(metadata.other).toEqual({
      "og:article:author": "Jane Doe",
      "twitter:label1": "Written by",
      "twitter:data1": "Jane Doe",
      "twitter:label2": "Est. reading time",
      "twitter:data2": "5 minutes",
    });
  });

  it("includes all article authors in og:article:author", () => {
    const metadata = getSEOMetadata({
      ogType: "article",
      authors: [{ name: "Jane Doe" }, { name: "John Smith" }],
    });

    expect(metadata.other?.["og:article:author"]).toEqual([
      "Jane Doe",
      "John Smith",
    ]);
  });

  it("does not include article twitter labels for non-article pages", () => {
    const metadata = getSEOMetadata({
      readingTime: 5,
      authors: [{ name: "Jane Doe" }],
    });

    expect(metadata.other).toBeUndefined();
  });

  it("sets article open graph type and section when provided", () => {
    const metadata = getSEOMetadata({
      ogType: "article",
      articleSection: "College Football",
      authors: [{ name: "Jane Doe" }],
      publishedTime: "2024-01-01T00:00:00.000Z",
      modifiedTime: "2024-01-02T00:00:00.000Z",
    });

    const openGraph = getOpenGraph(metadata);
    expect(openGraph.type).toBe("article");
    expect(openGraph.section).toBe("College Football");
    expect(openGraph.authors).toEqual(["Jane Doe"]);
    expect(openGraph.publishedTime).toBe("2024-01-01T00:00:00.000Z");
    expect(openGraph.modifiedTime).toBe("2024-01-02T00:00:00.000Z");
  });

  it("sets noindex robots when requested", () => {
    const metadata = getSEOMetadata({ noIndex: true });

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    });
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

  it("prefers mainImage over defaultOpenGraphImage when seoImage is absent", () => {
    const metadata = getSEOMetadata({
      image: { asset: { _ref: "main" }, alt: "Main" },
      defaultOpenGraphImage: "https://example.com/default.jpg",
    });

    expect(getFirstOgImage(metadata)?.url).toBe(
      "https://cdn.sanity.io/test-image.jpg",
    );
    expect(getFirstOgImage(metadata)?.alt).toBe("Main");
  });
});
