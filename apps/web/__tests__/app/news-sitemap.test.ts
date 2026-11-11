const { mockSanityFetchMetadata } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  newsSitemapQuery: "newsSitemapQuery",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://www.redshirtsports.com",
}));

import { buildNewsSitemap, escapeXml, GET } from "@/app/news-sitemap.xml/route";

const post = {
  _id: "p1",
  title: 'Montana & Montana State <clash> in "Brawl" o\'the Wild',
  publishedAt: "2026-11-10T18:00:00.000Z",
  slug: "brawl-of-the-wild",
};

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });
});

describe("buildNewsSitemap", () => {
  it("writes a news entry per article", () => {
    const xml = buildNewsSitemap(
      [post],
      "https://www.redshirtsports.com",
      "Redshirt Sports",
    );
    expect(xml).toContain(
      'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"',
    );
    expect(xml).toContain(
      "<loc>https://www.redshirtsports.com/brawl-of-the-wild</loc>",
    );
    expect(xml).toContain("<news:name>Redshirt Sports</news:name>");
    expect(xml).toContain(
      "<news:publication_date>2026-11-10T18:00:00.000Z</news:publication_date>",
    );
    expect(xml).toContain(
      "<news:title>Montana &amp; Montana State &lt;clash&gt; in &quot;Brawl&quot; o&apos;the Wild</news:title>",
    );
  });

  it("is a valid empty urlset when nothing is recent", () => {
    const xml = buildNewsSitemap([], "https://x.com", "X");
    expect(xml).toContain("<urlset");
    expect(xml).not.toContain("<url>");
  });
});

describe("GET /news-sitemap.xml", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
  });

  it("serves recent articles as XML with a short cache", async () => {
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
    mockSanityFetchMetadata.mockResolvedValue({ data: [post] });

    const res = await GET();

    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "newsSitemapQuery",
      perspective: "published",
    });
    expect(res.headers.get("Content-Type")).toBe(
      "application/xml; charset=utf-8",
    );
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(await res.text()).toContain("brawl-of-the-wild");
  });

  it("falls back to the site name and an empty list", async () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    mockSanityFetchMetadata.mockResolvedValue({ data: null });

    const text = await (await GET()).text();

    expect(text).not.toContain("<url>");
    expect(text).toContain("<urlset");
  });
});
