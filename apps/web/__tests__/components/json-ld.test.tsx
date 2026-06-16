const { mockGetDynamicFetchOptions, mockSanityFetchPage } = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi.fn(),
  mockSanityFetchPage: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("next-sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-sanity")>();
  return {
    ...actual,
    toPlainText: () => "one two three four",
  };
});

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlFor: () => ({
    size: () => ({
      dpr: () => ({
        auto: () => ({
          quality: () => ({
            url: () => "https://cdn.sanity.io/test.jpg",
          }),
        }),
      }),
    }),
  }),
}));

import { render } from "@testing-library/react";

import {
  ArticleJsonLd,
  buildSafeImageUrl,
  CachedCombinedJsonLd,
  DynamicCombinedJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
  WebPageJsonLd,
  WebSiteJsonLd,
} from "@/components/json-ld";

describe("JsonLdScript", () => {
  it("renders structured data as a JSON-LD script tag", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Home",
    };

    const { container } = render(
      <JsonLdScript data={data} id="test-json-ld" />,
    );

    const script = container.querySelector("#test-json-ld");
    expect(script).toHaveAttribute("type", "application/ld+json");
    expect(script?.textContent).toBe(JSON.stringify(data, null, 0));
  });
});

describe("buildSafeImageUrl", () => {
  it("returns undefined when the image reference is missing", () => {
    expect(buildSafeImageUrl()).toBeUndefined();
    expect(buildSafeImageUrl({ asset: undefined })).toBeUndefined();
  });

  it("returns a Sanity image URL when a reference is present", () => {
    expect(buildSafeImageUrl({ asset: { _ref: "image-123" } })).toBe(
      "https://cdn.sanity.io/test.jpg",
    );
  });
});

describe("ArticleJsonLd", () => {
  it("returns null when article is missing", () => {
    const { container } = render(<ArticleJsonLd article={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders article structured data", () => {
    const { container } = render(
      <ArticleJsonLd
        article={{
          slug: "test-article",
          title: "Test Article",
          excerpt: "Excerpt",
          publishedAt: "2026-01-01T00:00:00Z",
          _updatedAt: "2026-01-02T00:00:00Z",
          body: [],
          authors: [{ name: "Jane Doe", slug: "jane-doe" }],
          mainImage: { alt: "Hero", asset: { _ref: "image-123" } },
        }}
      />,
    );

    const script = container.querySelector("#article-json-ld-test-article");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data["@type"]).toBe("NewsArticle");
    expect(data.headline).toBe("Test Article");
    expect(data.wordCount).toBe(4);
    expect(data.author[0].url).toBe(
      "https://redshirtsports.com/authors/jane-doe",
    );
  });

  it("renders with an empty authors list when authors are missing", () => {
    const { container } = render(
      <ArticleJsonLd
        article={{
          slug: "no-authors",
          title: "Test Article",
          body: [],
          mainImage: { alt: "Hero" },
        }}
      />,
    );

    const script = container.querySelector("#article-json-ld-no-authors");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data.author).toEqual([]);
  });

  it("omits author URLs when slug is missing", () => {
    const { container } = render(
      <ArticleJsonLd
        article={{
          slug: "no-author-slug",
          title: "Test Article",
          body: [],
          authors: [{ name: "Jane Doe" }],
          mainImage: { alt: "Hero" },
        }}
      />,
    );

    const script = container.querySelector("#article-json-ld-no-author-slug");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data.author[0].url).toBeUndefined();
  });

  it("uses dynamic copyright year from publishedAt", () => {
    const { container } = render(
      <ArticleJsonLd
        article={{
          slug: "copyright-year",
          title: "Test Article",
          publishedAt: "2024-03-15T00:00:00Z",
          _updatedAt: "2024-03-16T00:00:00Z",
          excerpt: "Excerpt",
          body: [],
          authors: [{ name: "Jane Doe", slug: "jane-doe" }],
          mainImage: { alt: "Hero", asset: { _ref: "image-123" } },
        }}
      />,
    );

    const data = JSON.parse(
      container.querySelector("#article-json-ld-copyright-year")?.textContent ??
        "{}",
    );

    expect(data.copyrightYear).toBe(2024);
  });
});

describe("OrganizationJsonLd", () => {
  it("returns null when settings are missing", () => {
    const { container } = render(<OrganizationJsonLd settings={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses default organization values when optional fields are missing", () => {
    const { container } = render(<OrganizationJsonLd settings={{}} />);
    const data = JSON.parse(
      container.querySelector("#organization-json-ld")?.textContent ?? "{}",
    );

    expect(data.name).toBe("Redshirt Sports");
    expect(data.description).toBeUndefined();
    expect(data.logo).toBeUndefined();
    expect(data.contactPoint).toBeUndefined();
    expect(data.sameAs).toBeUndefined();
  });

  it("renders organization structured data with optional fields", () => {
    const { container } = render(
      <OrganizationJsonLd
        settings={{
          siteBrand: "Redshirt Sports",
          siteDescription: "College sports coverage",
          logo: "https://redshirtsports.com/logo.png",
          contactEmail: "hello@redshirtsports.com",
          socialLinks: {
            twitter: "https://x.com/redshirtsports",
            facebook: "",
          },
        }}
      />,
    );

    const script = container.querySelector("#organization-json-ld");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data.name).toBe("Redshirt Sports");
    expect(data.logo.url).toBe("https://redshirtsports.com/logo.png");
    expect(data.contactPoint.email).toBe("hello@redshirtsports.com");
    expect(data.sameAs).toEqual(["https://x.com/redshirtsports"]);
  });
});

describe("WebSiteJsonLd", () => {
  it("returns null when settings are missing", () => {
    const { container } = render(<WebSiteJsonLd settings={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders website structured data without a description", () => {
    const { container } = render(
      <WebSiteJsonLd settings={{ siteTitle: "Redshirt Sports" }} />,
    );

    const data = JSON.parse(
      container.querySelector("#website-json-ld")?.textContent ?? "{}",
    );

    expect(data.description).toBeUndefined();
  });

  it("renders website structured data", () => {
    const { container } = render(
      <WebSiteJsonLd
        settings={{
          siteTitle: "Redshirt Sports",
          siteDescription: "College sports coverage",
        }}
      />,
    );

    const script = container.querySelector("#website-json-ld");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data["@type"]).toBe("WebSite");
    expect(data.name).toBe("Redshirt Sports");
    expect(data.potentialAction[0].target.urlTemplate).toContain("/search?q=");
  });
});

describe("WebPageJsonLd", () => {
  it("renders a basic webpage schema", () => {
    const { container } = render(<WebPageJsonLd />);
    const script = container.querySelector("#webpage-json-ld");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data["@type"]).toBe("WebPage");
  });
});

describe("DynamicCombinedJsonLd", () => {
  beforeEach(() => {
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "published",
      stega: false,
    });
    mockSanityFetchPage.mockResolvedValue({
      data: {
        name: "Redshirt Sports",
        siteTitle: "Redshirt Sports",
        siteDescription: "College sports coverage",
      },
    });
  });

  it("loads dynamic fetch options before rendering cached JSON-LD", async () => {
    const component = await DynamicCombinedJsonLd();

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });

  it("can be called directly with fetch options", async () => {
    const component = await CachedCombinedJsonLd({
      perspective: "published",
      stega: false,
    });
    const { container } = render(component);

    expect(container.querySelector("#organization-json-ld")).toBeTruthy();
    expect(container.querySelector("#website-json-ld")).toBeTruthy();
  });
});
