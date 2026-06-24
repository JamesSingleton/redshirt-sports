import {
  buildPostPageJsonLd,
  buildSafeImageUrl,
  buildTeamPageJsonLd,
  CachedCombinedJsonLd,
  DynamicCombinedJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
  organizationId,
  PostPageJsonLd,
  TeamPageJsonLd,
  WebSiteJsonLd,
  websiteId,
} from "@/components/json-ld";

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

const sampleArticle = {
  slug: "test-article",
  title: "Test Article",
  excerpt: "Excerpt",
  publishedAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-02T00:00:00Z",
  body: [],
  authors: [{ name: "Jane Doe", slug: "jane-doe" }],
  sport: { slug: "football", title: "Football" },
  tags: [{ name: "Recruiting" }],
  image: { alt: "Hero", asset: { _ref: "image-123" } },
};

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

describe("buildPostPageJsonLd", () => {
  it("builds a linked article graph with sport section and tags", () => {
    const data = buildPostPageJsonLd(sampleArticle, {
      siteBrand: "Redshirt Sports",
      logo: "https://redshirtsports.com/logo.png",
    });

    const article = data?.["@graph"]?.find(
      (node) => typeof node === "object" && node?.["@type"] === "NewsArticle",
    ) as Record<string, unknown> | undefined;
    const webPage = data?.["@graph"]?.find(
      (node) =>
        typeof node === "object" &&
        node?.["@type"] === "WebPage" &&
        node?.["@id"] === "https://redshirtsports.com/test-article",
    ) as Record<string, unknown> | undefined;

    expect(article?.headline).toBe("Test Article");
    expect(article?.articleSection).toBe("College Football");
    expect(article?.keywords).toBe("Recruiting");
    expect(article?.isPartOf).toEqual({ "@id": websiteId });
    expect(article?.publisher).toMatchObject({
      "@id": organizationId,
      name: "Redshirt Sports",
    });
    expect(webPage?.speakable).toEqual({
      "@type": "SpeakableSpecification",
      cssSelector: ["#article-title", "#article-excerpt"],
    });
  });

  it("omits image fields when the image is missing", () => {
    const data = buildPostPageJsonLd({
      ...sampleArticle,
      image: { alt: "Hero" },
    });
    const article = data?.["@graph"]?.find(
      (node) => typeof node === "object" && node?.["@type"] === "NewsArticle",
    ) as Record<string, unknown> | undefined;

    expect(article?.image).toBeUndefined();
    expect(article?.thumbnailUrl).toBeUndefined();
  });
});

describe("PostPageJsonLd", () => {
  it("returns null when article is missing", () => {
    const { container } = render(<PostPageJsonLd article={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders article structured data as a graph", () => {
    const { container } = render(<PostPageJsonLd article={sampleArticle} />);

    const script = container.querySelector("#article-json-ld-test-article");
    const data = JSON.parse(script?.textContent ?? "{}");

    expect(data["@graph"]).toBeDefined();
    expect(
      data["@graph"].some(
        (node: { ["@type"]?: string }) => node["@type"] === "NewsArticle",
      ),
    ).toBe(true);
  });
});

describe("buildTeamPageJsonLd", () => {
  it("builds team, webpage, and breadcrumb nodes", () => {
    const data = buildTeamPageJsonLd({
      slug: "alabama",
      name: "University of Alabama",
      shortName: "Alabama",
      nickname: "Crimson Tide",
      websiteUrl: "https://rolltide.com",
      socialLinks: { twitter: "https://x.com/rolltide" },
      image: { alt: "Logo", asset: { _ref: "image-123" } },
      conferenceAffiliations: [
        {
          sport: { title: "Football" },
          conference: { shortName: "SEC" },
        },
      ],
    });

    const team = data?.["@graph"]?.find(
      (node) => typeof node === "object" && node?.["@type"] === "SportsTeam",
    ) as Record<string, unknown> | undefined;

    expect(team?.name).toBe("Alabama Crimson Tide");
    expect(team?.sport).toBe("Football");
    expect(team?.sameAs).toEqual([
      "https://rolltide.com",
      "https://x.com/rolltide",
    ]);
  });
});

describe("TeamPageJsonLd", () => {
  it("renders team structured data", () => {
    const { container } = render(
      <TeamPageJsonLd
        school={{
          slug: "alabama",
          name: "University of Alabama",
        }}
      />,
    );

    expect(container.querySelector("#team-json-ld-alabama")).toBeTruthy();
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

    expect(data["@id"]).toBe(organizationId);
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

    expect(data["@id"]).toBe(organizationId);
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
