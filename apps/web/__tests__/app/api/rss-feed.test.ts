const { mockFetch, mockBuildSafeImageUrl } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockBuildSafeImageUrl: vi.fn(() => "https://cdn.example.com/img.jpg"),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockFetch },
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/components/json-ld", () => ({
  buildSafeImageUrl: mockBuildSafeImageUrl,
}));

describe("GET /api/rss/feed.xml", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("returns an RSS feed for posts", async () => {
    mockFetch.mockResolvedValue([
      {
        title: "Hello",
        slug: "hello",
        excerpt: "Excerpt",
        publishedAt: "2025-01-01T00:00:00Z",
        image: { asset: { _ref: "img" } },
      },
      {
        title: "No date",
        slug: "no-date",
        excerpt: "Excerpt 2",
        publishedAt: null,
        image: null,
      },
    ]);

    const { GET } = await import("@/app/api/rss/feed.xml/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain("Hello");
    expect(body).toContain("No date");
    expect(mockBuildSafeImageUrl).toHaveBeenCalled();
  });
});
