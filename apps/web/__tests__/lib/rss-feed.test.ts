import { makeFeedPost } from "../helpers/rss-feed-post";

const { mockSize } = vi.hoisted(() => ({
  mockSize: vi.fn(() => ({
    quality: () => ({
      url: () => "https://cdn.sanity.io/images/hero.jpg?w=1200&h=675&fm=jpg",
    }),
  })),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlForJpeg: vi.fn(() => ({ size: mockSize })),
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
  getSiteEmailDomain: () => "redshirtsports.com",
}));

import { createRssResponse, rssNotFound } from "@/lib/rss-feed";

async function render(posts = [makeFeedPost()]) {
  const res = createRssResponse({
    feed: {
      path: "/api/rss/football/fcs/feed.xml",
      title: "Redshirt Sports: FCS Football News",
    },
    description: "FCS coverage",
    pagePath: "/college/football/news/fcs",
    posts,
  });
  return { res, body: await res.text() };
}

describe("createRssResponse", () => {
  beforeEach(() => {
    mockSize.mockClear();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("returns cacheable RSS with the channel details", async () => {
    const { res, body } = await render();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(body).toContain("<title>Redshirt Sports: FCS Football News</title>");
    expect(body).toContain("<description>FCS coverage</description>");
    expect(body).toContain(
      "<link>https://redshirtsports.com/college/football/news/fcs</link>",
    );
    expect(body).toContain(
      'href="https://redshirtsports.com/api/rss/football/fcs/feed.xml" rel="self"',
    );
  });

  it("uses the Sanity document ID as a non-permalink guid", async () => {
    const { body } = await render();

    expect(body).toContain('<guid isPermaLink="false">post-1</guid>');
    expect(body).toContain("<link>https://redshirtsports.com/hello</link>");
  });

  it("sets the feed updated date to the newest post", async () => {
    const { body } = await render([
      makeFeedPost(),
      makeFeedPost({ _id: "post-2", publishedAt: "2026-09-01T00:00:00Z" }),
    ]);

    expect(body).toContain(
      "<lastBuildDate>Mon, 28 Sep 2026 12:00:00 GMT</lastBuildDate>",
    );
    expect(body).toContain("<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>");
  });

  it("includes the excerpt as the description and the body as full content", async () => {
    const { body } = await render();

    expect(body).toContain("<description><![CDATA[Excerpt]]></description>");
    expect(body).toContain(
      "<content:encoded><![CDATA[<p>Full body text</p>]]></content:encoded>",
    );
  });

  it("falls back to the excerpt when the body renders empty", async () => {
    const { body } = await render([
      makeFeedPost({ body: [], excerpt: "Short & sweet" }),
    ]);

    expect(body).toContain(
      "<content:encoded><![CDATA[<p>Short &amp; sweet</p>]]></content:encoded>",
    );
  });

  it("adds a 1200x675 JPEG enclosure with an explicit MIME type", async () => {
    const { body } = await render();

    expect(mockSize).toHaveBeenCalledWith(1200, 675);
    const enclosure = body.match(/<enclosure [^>]*\/>/)?.[0];
    expect(enclosure).toContain(
      'url="https://cdn.sanity.io/images/hero.jpg?w=1200&amp;h=675&amp;fm=jpg"',
    );
    expect(enclosure).toContain('type="image/jpeg"');
    expect(enclosure).toContain('length="0"');
  });

  it("omits the enclosure when a post has no image asset", async () => {
    const { body } = await render([
      makeFeedPost({ image: null }),
      makeFeedPost({ _id: "post-2", image: { alt: "No asset" } }),
    ]);

    expect(body).not.toContain("<enclosure");
  });

  it("lists authors as dc:creator", async () => {
    const { body } = await render();

    expect(body).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(body).toContain(
      "<dc:creator><![CDATA[Jane Doe and John Smith]]></dc:creator>",
    );
    expect(body).not.toContain("<author>");
  });

  it("omits dc:creator when a post has no authors", async () => {
    const { body } = await render([makeFeedPost({ authors: [] })]);

    expect(body).not.toContain("<dc:creator>");
  });

  it("adds deduplicated categories from sport, division, conferences, and tags", async () => {
    const { body } = await render();

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
    const { body } = await render([
      makeFeedPost({
        sport: null,
        division: null,
        sportSubgrouping: null,
        conferences: null,
        tags: null,
      }),
    ]);

    expect(body).not.toContain("<category>");
  });

  it("renders an empty channel when there are no posts", async () => {
    const { res, body } = await render([]);

    expect(res.status).toBe(200);
    expect(body).not.toContain("<item>");
    expect(body).not.toContain("<lastBuildDate>Mon, 28 Sep");
  });
});

describe("rssNotFound", () => {
  it("returns a 404", async () => {
    const res = rssNotFound();

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Feed not found");
  });
});
