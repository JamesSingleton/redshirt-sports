import { makeFeedPost } from "../../helpers/rss-feed-post";

const { mockSanityFetchMetadata, mockCreateRssResponse } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockCreateRssResponse: vi.fn(() => new Response("rss")),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  rssFeedBySportQuery: "rssFeedBySportQuery",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/rss-feed", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rss-feed")>()),
  createRssResponse: mockCreateRssResponse,
}));

import { GET } from "@/app/api/rss/[sport]/feed.xml/route";

function mockSanity({
  sportTitle,
  posts,
}: {
  sportTitle: string | null;
  posts: unknown[] | null;
}) {
  mockSanityFetchMetadata.mockImplementation(
    async ({ query }: { query: string }) => ({
      data:
        query === "sportInfoBySlug"
          ? sportTitle && { title: sportTitle }
          : posts,
    }),
  );
}

function request(sport: string) {
  return GET(
    new Request(`https://redshirtsports.com/api/rss/${sport}/feed.xml`),
    {
      params: Promise.resolve({ sport }),
    },
  );
}

describe("GET /api/rss/[sport]/feed.xml", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    mockCreateRssResponse.mockClear();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("builds the sport feed", async () => {
    const posts = [makeFeedPost()];
    mockSanity({ sportTitle: "Football", posts });

    const res = await request("football");

    expect(res.status).toBe(200);
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "sportInfoBySlug",
      params: { slug: "football" },
      perspective: "published",
    });
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "rssFeedBySportQuery",
      params: { sport: "football" },
      perspective: "published",
    });
    expect(mockCreateRssResponse).toHaveBeenCalledWith({
      feed: {
        path: "/api/rss/football/feed.xml",
        title: "Redshirt Sports: Football News",
      },
      description:
        "The latest college Football news, analysis, and features from Redshirt Sports.",
      pagePath: "/college/football/news",
      posts,
    });
  });

  it("returns 404 for an unknown sport", async () => {
    mockSanity({ sportTitle: null, posts: [makeFeedPost()] });

    const res = await request("curling");

    expect(res.status).toBe(404);
    expect(mockCreateRssResponse).not.toHaveBeenCalled();
  });

  it.each([[[]], [null]])(
    "returns 404 when the sport has no posts (%j)",
    async (posts) => {
      mockSanity({ sportTitle: "Men's Basketball", posts });

      const res = await request("mens-basketball");

      expect(res.status).toBe(404);
    },
  );
});
