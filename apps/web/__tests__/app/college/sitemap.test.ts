const { mockSanityFetchMetadata, mockConferenceMatches } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockConferenceMatches: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryForCollegeSitemap: "queryForCollegeSitemap",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

vi.mock("@/lib/conference-division-match", () => ({
  conferenceMatchesDivisionSegment: mockConferenceMatches,
}));

import collegeSitemap from "@/app/college/sitemap";

describe("college sitemap", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    mockConferenceMatches.mockReset().mockReturnValue(true);
  });

  it("builds sport, division, and conference URLs from posts", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "d1",
          sportSubgrouping: "fbs",
          conferences: [{ slug: "sec" }],
          _updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const urls = await collegeSitemap();

    expect(urls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://redshirtsports.xyz/college/football/news",
        }),
        expect.objectContaining({
          url: "https://redshirtsports.xyz/college/football/news/fbs",
        }),
        expect.objectContaining({
          url: "https://redshirtsports.xyz/college/football/news/fbs/sec",
        }),
      ]),
    );
  });

  it("skips D1 posts without sportSubgrouping", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "d1",
          sportSubgrouping: null,
          conferences: [],
          _updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const urls = await collegeSitemap();
    expect(urls).toEqual([
      expect.objectContaining({
        url: "https://redshirtsports.xyz/college/football/news",
      }),
    ]);
  });

  it("skips posts without a sport slug", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [{ sport: null, division: "d2", _updatedAt: "2026-01-01T00:00:00Z" }],
    });
    const urls = await collegeSitemap();
    expect(urls).toEqual([]);
  });

  it("uses raw division segment for non-D1 posts", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "d2",
          sportSubgrouping: null,
          conferences: [],
          _updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const urls = await collegeSitemap();
    expect(urls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://redshirtsports.xyz/college/football/news/d2",
        }),
      ]),
    );
  });

  it("maps division-i posts through sportSubgrouping", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "division-i",
          sportSubgrouping: "fcs",
          conferences: [{ slug: "mvfc" }],
          _updatedAt: "2026-01-02T00:00:00Z",
        },
      ],
    });
    const urls = await collegeSitemap();
    expect(urls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://redshirtsports.xyz/college/football/news/fcs/mvfc",
        }),
      ]),
    );
  });

  it("keeps the newest timestamp when duplicate URLs appear", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "d2",
          conferences: [],
          _updatedAt: "2026-01-10T00:00:00Z",
        },
        {
          sport: "football",
          division: "d2",
          conferences: [],
          _updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const urls = await collegeSitemap();
    const divisionUrl = urls.find((entry) =>
      entry.url.endsWith("/college/football/news/d2"),
    );
    expect(divisionUrl?.lastModified).toEqual(new Date("2026-01-10T00:00:00Z"));
  });

  it("skips conference URLs when the conference does not match the division segment", async () => {
    mockConferenceMatches.mockReturnValue(false);
    mockSanityFetchMetadata.mockResolvedValue({
      data: [
        {
          sport: "football",
          division: "d1",
          sportSubgrouping: "fbs",
          conferences: [{ slug: "sec" }],
          _updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const urls = await collegeSitemap();
    expect(
      urls.some((entry) => entry.url.includes("/fbs/sec")),
    ).toBe(false);
  });
});
