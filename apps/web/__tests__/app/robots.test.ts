const { mockSports } = vi.hoisted(() => ({ mockSports: vi.fn() }));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/rankings/sitemap", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rankings/sitemap")>()),
  sportsWithPublishedRankings: mockSports,
}));

import robots from "@/app/robots";

describe("robots", () => {
  beforeEach(() => {
    mockSports.mockReset().mockResolvedValue(["football"]);
  });

  it("returns disallow rules and sitemap URLs", async () => {
    const result = await robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: ["/"],
        disallow: expect.arrayContaining(["/api/cron/", "/vote/", "/search/"]),
      }),
    );
    expect(result.sitemap).toEqual(
      expect.arrayContaining([
        "https://redshirtsports.com/sitemap.xml",
        "https://redshirtsports.com/college/sitemap.xml",
      ]),
    );
  });

  it("lists a rankings sitemap only for sports with a published poll", async () => {
    const football = await robots();
    expect(football.sitemap).toContain(
      "https://redshirtsports.com/college/football/rankings/sitemap.xml",
    );
    expect(String(football.sitemap)).not.toContain("basketball");

    mockSports.mockResolvedValue(["football", "mens-basketball"]);
    const both = await robots();
    expect(both.sitemap).toEqual(
      expect.arrayContaining([
        "https://redshirtsports.com/college/football/rankings/sitemap.xml",
        "https://redshirtsports.com/college/mens-basketball/rankings/sitemap.xml",
      ]),
    );
  });
});
