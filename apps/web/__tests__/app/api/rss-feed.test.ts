const { mockSanityFetchMetadata, mockSize } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockSize: vi.fn(() => ({
    quality: () => ({
      url: () => "https://cdn.sanity.io/images/hero.jpg?w=1200&h=675&fm=jpg",
    }),
  })),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  rssFeedQuery: "rssFeedQuery",
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlForJpeg: vi.fn(() => ({ size: mockSize })),
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
  getSiteEmailDomain: () => "redshirtsports.com",
}));

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    _id: "post-1",
    title: "Hello",
    slug: "hello",
    excerpt: "Excerpt",
    publishedAt: "2026-09-28T12:00:00Z",
    image: { asset: { _ref: "img" } },
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: "s1", text: "Full body text" }],
      },
    ],
    authors: ["Jane Doe", "John Smith"],
    sport: "Football",
    division: "Division I",
    sportSubgrouping: "FCS",
    conferences: [
      { name: "Southland Conference", shortName: "Southland" },
      { name: "Big Sky Conference", shortName: "" },
    ],
    tags: ["Southland", "Playoffs"],
    ...overrides,
  };
}

async function getFeed(posts: unknown[] | null) {
  mockSanityFetchMetadata.mockResolvedValue({ data: posts });
  const { GET } = await import("@/app/api/rss/feed.xml/route");
  const res = await GET();
  return { res, body: await res.text() };
}

describe("GET /api/rss/feed.xml", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("fetches published posts through Sanity Live", async () => {
    const { res } = await getFeed([makePost()]);

    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "rssFeedQuery",
      perspective: "published",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
  });

  it("uses the Sanity document ID as a non-permalink guid", async () => {
    const { body } = await getFeed([makePost()]);

    expect(body).toContain('<guid isPermaLink="false">post-1</guid>');
    expect(body).toContain("<link>https://redshirtsports.com/hello</link>");
  });

  it("sets the feed updated date to the newest post", async () => {
    const { body } = await getFeed([
      makePost(),
      makePost({ _id: "post-2", publishedAt: "2026-09-01T00:00:00Z" }),
    ]);

    expect(body).toContain(
      "<lastBuildDate>Mon, 28 Sep 2026 12:00:00 GMT</lastBuildDate>",
    );
    expect(body).toContain("<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>");
  });

  it("includes the excerpt as the description and the body as full content", async () => {
    const { body } = await getFeed([makePost()]);

    expect(body).toContain("<description><![CDATA[Excerpt]]></description>");
    expect(body).toContain(
      "<content:encoded><![CDATA[<p>Full body text</p>]]></content:encoded>",
    );
  });

  it("adds a 1200x675 JPEG enclosure with an explicit MIME type", async () => {
    const { body } = await getFeed([makePost()]);

    expect(mockSize).toHaveBeenCalledWith(1200, 675);
    const enclosure = body.match(/<enclosure [^>]*\/>/)?.[0];
    expect(enclosure).toContain(
      'url="https://cdn.sanity.io/images/hero.jpg?w=1200&amp;h=675&amp;fm=jpg"',
    );
    expect(enclosure).toContain('type="image/jpeg"');
    expect(enclosure).toContain('length="0"');
  });

  it("omits the enclosure when a post has no image asset", async () => {
    const { body } = await getFeed([
      makePost({ image: null }),
      makePost({ _id: "post-2", image: { alt: "No asset" } }),
    ]);

    expect(body).not.toContain("<enclosure");
  });

  it("falls back to the excerpt when the body renders empty", async () => {
    const { body } = await getFeed([
      makePost({ body: [], excerpt: "Short & sweet" }),
    ]);

    expect(body).toContain(
      "<content:encoded><![CDATA[<p>Short &amp; sweet</p>]]></content:encoded>",
    );
  });

  it("lists authors as dc:creator", async () => {
    const { body } = await getFeed([makePost()]);

    expect(body).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(body).toContain(
      "<dc:creator><![CDATA[Jane Doe and John Smith]]></dc:creator>",
    );
    expect(body).not.toContain("<author>");
  });

  it("omits dc:creator when a post has no authors", async () => {
    const { body } = await getFeed([makePost({ authors: [] })]);

    expect(body).not.toContain("<dc:creator>");
  });

  it("adds deduplicated categories from sport, division, conferences, and tags", async () => {
    const { body } = await getFeed([makePost()]);

    const categories = [...body.matchAll(/<category>(.*?)<\/category>/g)].map(
      (match) => match[1],
    );
    expect(categories).toEqual([
      "Football",
      "Division I",
      "FCS",
      "Southland",
      "Big Sky Conference",
      "Playoffs",
    ]);
  });

  it("skips missing categories", async () => {
    const { body } = await getFeed([
      makePost({
        sport: null,
        division: null,
        sportSubgrouping: null,
        conferences: null,
        tags: null,
      }),
    ]);

    expect(body).not.toContain("<category>");
  });

  it("returns an empty feed when Sanity returns no data", async () => {
    const { res, body } = await getFeed(null);

    expect(res.status).toBe(200);
    expect(body).not.toContain("<item>");
  });
});
