import sitemap from "@/app/rankings/sitemap";

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

  it("lists every sport's published rankings pages", async () => {
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

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        `${BASE}/college/football/rankings`,
        `${BASE}/college/football/rankings/fbs/2025/0`,
        `${BASE}/college/football/rankings/fcs/2025/3`,
        `${BASE}/college/football/rankings/d2/2024/final-rankings`,
        `${BASE}/college/football/rankings/fbs/voters`,
        `${BASE}/college/football/rankings/fcs/history`,
        `${BASE}/college/mens-basketball/rankings`,
        `${BASE}/college/mens-basketball/rankings/power-conferences/2026/1`,
      ]),
    );
    expect(urls).not.toContain(
      `${BASE}/college/football/rankings/power-conferences/2026/1`,
    );
    expect(urls.some((url) => url.endsWith("/ballots"))).toBe(false);
    expect(urls.some((url) => url.includes("/methodology"))).toBe(false);
  });

  it("leaves out sports without a published poll", async () => {
    mockGetYearsWithVotes.mockResolvedValue([
      { year: 2025, week: 1, division: "fbs", sport: "football" },
      { year: 2025, week: 1, division: "d1", sport: "soccer" },
    ]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain(`${BASE}/college/football/rankings/fbs/2025/1`);
    expect(urls.some((url) => url.includes("basketball"))).toBe(false);
    expect(urls.some((url) => url.includes("soccer"))).toBe(false);
  });

  it("lists each poll's stable URL with its latest publish date", async () => {
    const publishedAt = new Date("2026-10-26T15:00:00Z");
    mockGetYearsWithVotes.mockResolvedValue([
      { year: 2026, week: 7, division: "fcs", sport: "football" },
      { year: 2026, week: 8, division: "fcs", sport: "football" },
      { year: 2026, week: 1, division: "mid-major", sport: "mens-basketball" },
    ]);
    mockGetLatestFinalRankings.mockImplementation(
      async ({ division }: { division: string }) =>
        division === "fcs"
          ? { division, week: 8, year: 2026, publishedAt }
          : { division, week: 1, year: 2026, publishedAt: null },
    );

    const entries = await sitemap();

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
        (entry) =>
          entry.url === `${BASE}/college/mens-basketball/rankings/mid-major`,
      ),
    ).toEqual({
      url: `${BASE}/college/mens-basketball/rankings/mid-major`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(mockGetLatestFinalRankings).toHaveBeenCalledWith({
      division: "fcs",
      sport: "football",
    });
  });
});
