import {
  rankingsSitemapEntries,
  rankingsSitemapPath,
  sitemapXml,
  sportsWithPublishedRankings,
} from "@/lib/rankings/sitemap";

const { mockGetYearsWithVotes, mockGetLatestFinalRankings } = vi.hoisted(
  () => ({
    mockGetYearsWithVotes: vi.fn(),
    mockGetLatestFinalRankings: vi.fn(),
  }),
);

vi.mock("@redshirt-sports/db/queries", () => ({
  getYearsWithVotes: mockGetYearsWithVotes,
  getLatestFinalRankings: mockGetLatestFinalRankings,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

const BASE = "https://redshirtsports.com";

describe("rankings sitemap", () => {
  beforeEach(() => {
    mockGetYearsWithVotes.mockReset();
    mockGetLatestFinalRankings.mockReset().mockResolvedValue(undefined);
  });

  it("builds the sitemap path for a sport", () => {
    expect(rankingsSitemapPath("mens-basketball")).toBe(
      "/college/mens-basketball/rankings/sitemap.xml",
    );
  });

  describe("sportsWithPublishedRankings", () => {
    it("lists each public sport with a published week once", async () => {
      mockGetYearsWithVotes.mockResolvedValue([
        { year: 2025, week: 1, division: "fbs", sport: "football" },
        { year: 2025, week: 2, division: "fcs", sport: "football" },
        { year: 2025, week: 1, division: "d1", sport: "soccer" },
      ]);

      await expect(sportsWithPublishedRankings()).resolves.toEqual([
        "football",
      ]);
    });
  });

  describe("rankingsSitemapEntries", () => {
    it("lists only the requested sport's rankings URLs", async () => {
      mockGetYearsWithVotes.mockResolvedValue([
        { year: 2025, week: 0, division: "fbs", sport: "football" },
        { year: 2025, week: 3, division: "fcs", sport: "football" },
        { year: 2024, week: 999, division: "d2", sport: "football" },
        {
          year: 2026,
          week: 1,
          division: "power-conferences",
          sport: "mens-basketball",
        },
      ]);

      const urls = (await rankingsSitemapEntries("football")).map(
        (entry) => entry.url,
      );

      expect(urls).toEqual(
        expect.arrayContaining([
          `${BASE}/college/football/rankings`,
          `${BASE}/college/football/rankings/fbs/2025/0`,
          `${BASE}/college/football/rankings/fcs/2025/3`,
          `${BASE}/college/football/rankings/d2/2024/final-rankings`,
          `${BASE}/college/football/rankings/fbs/voters`,
          `${BASE}/college/football/rankings/fcs/history`,
        ]),
      );
      expect(urls.some((url) => url.includes("basketball"))).toBe(false);
      expect(urls.some((url) => url.includes("power-conferences"))).toBe(false);
      expect(urls.some((url) => url.endsWith("/methodology"))).toBe(false);
    });

    it("is empty for a sport with no published poll", async () => {
      mockGetYearsWithVotes.mockResolvedValue([
        { year: 2025, week: 1, division: "fbs", sport: "football" },
      ]);

      await expect(rankingsSitemapEntries("mens-basketball")).resolves.toEqual(
        [],
      );
      expect(mockGetLatestFinalRankings).not.toHaveBeenCalled();
    });

    it("lists each poll's stable URL with its latest publish date", async () => {
      const publishedAt = new Date("2026-10-26T15:00:00Z");
      mockGetYearsWithVotes.mockResolvedValue([
        { year: 2026, week: 7, division: "fcs", sport: "football" },
        { year: 2026, week: 8, division: "fcs", sport: "football" },
        { year: 2026, week: 8, division: "fbs", sport: "football" },
      ]);
      mockGetLatestFinalRankings.mockImplementation(
        async ({ division }: { division: string }) =>
          division === "fcs"
            ? { division, week: 8, year: 2026, publishedAt }
            : { division, week: 8, year: 2026, publishedAt: null },
      );

      const entries = await rankingsSitemapEntries("football");

      expect(
        entries.filter(
          (entry) => entry.url === `${BASE}/college/football/rankings/fcs`,
        ),
      ).toEqual([
        {
          url: `${BASE}/college/football/rankings/fcs`,
          changeFrequency: "weekly",
          priority: 0.8,
          lastModified: publishedAt,
        },
      ]);
      expect(
        entries.find(
          (entry) => entry.url === `${BASE}/college/football/rankings/fbs`,
        ),
      ).toEqual({
        url: `${BASE}/college/football/rankings/fbs`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      expect(mockGetLatestFinalRankings).toHaveBeenCalledWith({
        division: "fcs",
        sport: "football",
      });
    });
  });

  describe("sitemapXml", () => {
    it("writes a urlset with optional fields and escaped URLs", () => {
      const xml = sitemapXml([
        {
          url: `${BASE}/a?x=1&y=<2>"'`,
          lastModified: "2026-10-26T15:00:00Z",
          changeFrequency: "weekly",
          priority: 0.8,
        },
        { url: `${BASE}/b` },
      ]);

      expect(xml).toBe(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          "<url>",
          `<loc>${BASE}/a?x=1&amp;y=&lt;2&gt;&quot;&apos;</loc>`,
          "<lastmod>2026-10-26T15:00:00.000Z</lastmod>",
          "<changefreq>weekly</changefreq>",
          "<priority>0.8</priority>",
          "</url>",
          "<url>",
          `<loc>${BASE}/b</loc>`,
          "</url>",
          "</urlset>",
          "",
        ].join("\n"),
      );
    });
  });
});
