const { mockSanityFetchMetadata } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  countOfPostsQuery: "countOfPostsQuery",
  postsForSitemapQuery: "postsForSitemapQuery",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import collegeNewsSitemap, {
  generateSitemaps,
} from "@/app/college/news/sitemap";

describe("college news sitemap", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
  });

  it("generateSitemaps returns one id per chunk", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: 120_000 });
    await expect(generateSitemaps()).resolves.toEqual([
      { id: 0 },
      { id: 1 },
      { id: 2 },
    ]);
  });

  it("returns post URLs for the requested chunk", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [{ slug: "story-one", _updatedAt: "2026-01-01T00:00:00Z" }],
    });

    const urls = await collegeNewsSitemap({ id: Promise.resolve(0) });

    expect(urls).toEqual([
      {
        url: "https://redshirtsports.com/story-one",
        lastModified: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("handles null post counts and post data", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });

    await expect(generateSitemaps()).resolves.toEqual([]);
    await expect(
      collegeNewsSitemap({ id: Promise.resolve(0) }),
    ).resolves.toEqual([]);
  });
});
