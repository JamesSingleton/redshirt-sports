const { mockSanityFetchMetadata } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  querySitemapData: "querySitemapData",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import sitemap from "@/app/sitemap";

describe("root sitemap", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
  });

  it("returns static pages, author URLs, and legal document URLs", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        authors: [
          { slug: "jane-author", lastModified: "2026-01-01T00:00:00Z" },
        ],
        legal: [{ slug: "terms-of-service", lastModified: "2026-09-01" }],
      },
    });

    const urls = await sitemap();

    expect(urls).toEqual(
      expect.arrayContaining([
        { url: "https://redshirtsports.com" },
        { url: "https://redshirtsports.com/about" },
        { url: "https://redshirtsports.com/contact" },
        { url: "https://redshirtsports.com/college/news" },
        {
          url: "https://redshirtsports.com/authors/jane-author",
          lastModified: new Date("2026-01-01T00:00:00Z"),
        },
        {
          url: "https://redshirtsports.com/legal/terms-of-service",
          lastModified: new Date("2026-09-01"),
        },
      ]),
    );
  });

  it("handles missing Sanity data", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    const urls = await sitemap();
    expect(urls).toHaveLength(4);
    expect(
      urls.every(
        (entry) =>
          !entry.url.includes("/authors/") && !entry.url.includes("/legal/"),
      ),
    ).toBe(true);
  });
});
