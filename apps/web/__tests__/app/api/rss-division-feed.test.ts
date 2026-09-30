import { makeFeedPost } from "../../helpers/rss-feed-post";

const { mockSanityFetchMetadata, mockCreateRssResponse } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
  mockCreateRssResponse: vi.fn(() => new Response("rss")),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryDivisionOrSubgroupingDisplayName:
    "queryDivisionOrSubgroupingDisplayName",
  rssFeedBySportAndDivisionQuery: "rssFeedBySportAndDivisionQuery",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/rss-feed", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rss-feed")>()),
  createRssResponse: mockCreateRssResponse,
}));

import { GET } from "@/app/api/rss/[sport]/[division]/feed.xml/route";

function mockSanity({
  sportTitle,
  divisionName,
  posts,
}: {
  sportTitle: string | null;
  divisionName: string | null;
  posts: unknown[] | null;
}) {
  mockSanityFetchMetadata.mockImplementation(
    async ({ query }: { query: string }) => {
      if (query === "sportInfoBySlug") {
        return { data: sportTitle && { title: sportTitle } };
      }
      if (query === "queryDivisionOrSubgroupingDisplayName") {
        return { data: divisionName && { displayName: divisionName } };
      }
      return { data: posts };
    },
  );
}

function request(sport: string, division: string) {
  return GET(
    new Request(
      `https://redshirtsports.com/api/rss/${sport}/${division}/feed.xml`,
    ),
    { params: Promise.resolve({ sport, division }) },
  );
}

describe("GET /api/rss/[sport]/[division]/feed.xml", () => {
  beforeEach(() => {
    mockSanityFetchMetadata.mockReset();
    mockCreateRssResponse.mockClear();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("builds the division feed", async () => {
    const posts = [makeFeedPost()];
    mockSanity({ sportTitle: "Football", divisionName: "FBS", posts });

    const res = await request("football", "fbs");

    expect(res.status).toBe(200);
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "queryDivisionOrSubgroupingDisplayName",
      params: { slugOrShortName: "fbs" },
      perspective: "published",
    });
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "rssFeedBySportAndDivisionQuery",
      params: { sport: "football", division: "fbs" },
      perspective: "published",
    });
    expect(mockCreateRssResponse).toHaveBeenCalledWith({
      feed: {
        path: "/api/rss/football/fbs/feed.xml",
        title: "Redshirt Sports: FBS Football News",
      },
      description:
        "The latest FBS Football news, analysis, and features from Redshirt Sports.",
      pagePath: "/college/football/news/fbs",
      posts,
    });
  });

  it("returns 404 for an unknown sport", async () => {
    mockSanity({
      sportTitle: null,
      divisionName: "FBS",
      posts: [makeFeedPost()],
    });

    expect((await request("curling", "fbs")).status).toBe(404);
  });

  it("returns 404 for an unknown division", async () => {
    mockSanity({
      sportTitle: "Football",
      divisionName: null,
      posts: [makeFeedPost()],
    });

    expect((await request("football", "xyz")).status).toBe(404);
  });

  it.each([[[]], [null]])(
    "returns 404 when the division has no posts (%j)",
    async (posts) => {
      mockSanity({ sportTitle: "Football", divisionName: "Division I", posts });

      expect((await request("football", "d1")).status).toBe(404);
      expect(mockCreateRssResponse).not.toHaveBeenCalled();
    },
  );
});
