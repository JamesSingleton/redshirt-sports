import { makeFeedPost } from "../../helpers/rss-feed-post";

const { mockSanityFetchMetadata, mockCreateRssResponse } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockCreateRssResponse: vi.fn(() => new Response("rss")),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  rssFeedQuery: "rssFeedQuery",
}));

vi.mock("@/lib/rss-feed", () => ({
  createRssResponse: mockCreateRssResponse,
}));

import { GET } from "@/app/api/rss/feed.xml/route";

describe("GET /api/rss/feed.xml", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    mockCreateRssResponse.mockClear();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("builds the site-wide feed from the latest published posts", async () => {
    const posts = [makeFeedPost()];
    mockSanityFetchMetadata.mockResolvedValue({ data: posts });

    const res = await GET();

    expect(await res.text()).toBe("rss");
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "rssFeedQuery",
      perspective: "published",
    });
    expect(mockCreateRssResponse).toHaveBeenCalledWith({
      feed: { path: "/api/rss/feed.xml", title: "Redshirt Sports" },
      description: expect.stringContaining("college football and basketball"),
      pagePath: "/college/news",
      posts,
    });
  });

  it("passes an empty list when Sanity returns no data", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });

    await GET();

    expect(mockCreateRssResponse).toHaveBeenCalledWith(
      expect.objectContaining({ posts: [] }),
    );
  });
});
