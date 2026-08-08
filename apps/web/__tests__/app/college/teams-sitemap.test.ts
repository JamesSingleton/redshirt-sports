const {
  mockSanityFetchMetadata,
  mockGetCachedRankedSchoolSanityIds,
} = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockGetCachedRankedSchoolSanityIds: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  MIN_TEAM_PAGE_POSTS: 8,
  schoolSlugsByIdsQuery: "schoolSlugsByIdsQuery",
  schoolSlugsForSitemapQuery: "schoolSlugsForSitemapQuery",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedRankedSchoolSanityIds: mockGetCachedRankedSchoolSanityIds,
}));

import teamsSitemap from "@/app/college/teams/sitemap";

describe("teams sitemap", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    mockGetCachedRankedSchoolSanityIds.mockReset();
  });

  it("merges post-qualified and ranked team URLs", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({
        data: [{ slug: "alabama", _updatedAt: "2026-01-01T00:00:00Z" }],
      })
      .mockResolvedValueOnce({
        data: [{ slug: "georgia", _updatedAt: "2026-02-01T00:00:00Z" }],
      });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue(["school-2"]);

    const urls = await teamsSitemap();

    expect(urls).toEqual(
      expect.arrayContaining([
        {
          url: "https://redshirtsports.xyz/college/teams/alabama",
          lastModified: new Date("2026-01-01T00:00:00Z"),
          changeFrequency: "weekly",
          priority: 0.5,
        },
        {
          url: "https://redshirtsports.xyz/college/teams/georgia",
          lastModified: new Date("2026-02-01T00:00:00Z"),
          changeFrequency: "weekly",
          priority: 0.5,
        },
      ]),
    );
  });

  it("skips ranked slug lookup when there are no ranked schools", async () => {
    mockSanityFetchMetadata.mockResolvedValueOnce({
      data: [{ slug: "alabama", _updatedAt: "2026-01-01T00:00:00Z" }],
    });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue([]);

    const urls = await teamsSitemap();
    expect(urls).toHaveLength(1);
    expect(mockSanityFetchMetadata).toHaveBeenCalledTimes(1);
  });

  it("prefers the newer ranked slug timestamp when merging duplicates", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({
        data: [{ slug: "alabama", _updatedAt: "2026-01-01T00:00:00Z" }],
      })
      .mockResolvedValueOnce({
        data: [{ slug: "alabama", _updatedAt: "2026-03-01T00:00:00Z" }],
      });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue(["school-1"]);

    const urls = await teamsSitemap();
    expect(urls).toEqual([
      {
        url: "https://redshirtsports.xyz/college/teams/alabama",
        lastModified: new Date("2026-03-01T00:00:00Z"),
        changeFrequency: "weekly",
        priority: 0.5,
      },
    ]);
  });

  it("handles null post-qualified data", async () => {
    mockSanityFetchMetadata.mockResolvedValueOnce({ data: null });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue([]);

    const urls = await teamsSitemap();
    expect(urls).toEqual([]);
  });
});
