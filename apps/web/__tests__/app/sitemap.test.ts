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
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

import sitemap from "@/app/sitemap";

describe("root sitemap", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
  });

  it("returns static pages and author URLs", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        authors: [{ slug: "jane-author", lastModified: "2026-01-01T00:00:00Z" }],
      },
    });

    const urls = await sitemap();

    expect(urls).toEqual(
      expect.arrayContaining([
        { url: "https://redshirtsports.xyz" },
        { url: "https://redshirtsports.xyz/about" },
        { url: "https://redshirtsports.xyz/contact" },
        { url: "https://redshirtsports.xyz/privacy-policy" },
        { url: "https://redshirtsports.xyz/college/news" },
        {
          url: "https://redshirtsports.xyz/authors/jane-author",
          lastModified: new Date("2026-01-01T00:00:00Z"),
        },
      ]),
    );
  });

  it("handles missing author data", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    const urls = await sitemap();
    expect(urls).toHaveLength(5);
    expect(urls.every((entry) => !entry.url.includes("/authors/"))).toBe(true);
  });
});
