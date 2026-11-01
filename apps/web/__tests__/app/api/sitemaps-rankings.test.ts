import {
  GET,
  generateStaticParams,
} from "@/app/api/sitemaps/rankings/[sport]/route";

const { mockEntries, mockSports } = vi.hoisted(() => ({
  mockEntries: vi.fn(),
  mockSports: vi.fn(),
}));

vi.mock("@/lib/rankings/sitemap", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rankings/sitemap")>()),
  rankingsSitemapEntries: mockEntries,
  sportsWithPublishedRankings: mockSports,
}));

function get(sport: string) {
  return GET(new Request("https://redshirtsports.com"), {
    params: Promise.resolve({ sport }),
  });
}

describe("GET /college/[sport]/rankings/sitemap.xml", () => {
  beforeEach(() => {
    mockEntries.mockReset();
    mockSports.mockReset();
  });

  it("prerenders one sitemap per sport with a published poll", async () => {
    mockSports.mockResolvedValue(["football"]);

    await expect(generateStaticParams()).resolves.toEqual([
      { sport: "football" },
    ]);
  });

  it("serves the sport's rankings URLs as XML", async () => {
    mockEntries.mockResolvedValue([
      { url: "https://redshirtsports.com/college/football/rankings" },
    ]);

    const res = await get("football");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/xml");
    await expect(res.text()).resolves.toContain(
      "<loc>https://redshirtsports.com/college/football/rankings</loc>",
    );
    expect(mockEntries).toHaveBeenCalledWith("football");
  });

  it("404s for a sport with no published poll", async () => {
    mockEntries.mockResolvedValue([]);

    expect((await get("mens-basketball")).status).toBe(404);
  });

  it("404s for an unknown sport without querying", async () => {
    expect((await get("soccer")).status).toBe(404);
    expect(mockEntries).not.toHaveBeenCalled();
  });
});
