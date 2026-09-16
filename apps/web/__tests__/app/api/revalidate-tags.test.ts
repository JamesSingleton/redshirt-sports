const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

const SANITY_SECRET = "sanity-secret";
const CACHE_SECRET = "cache-secret";

describe("POST /api/revalidate-tags", () => {
  const originalSanitySecret = process.env.SANITY_REVALIDATE_SECRET;
  const originalCacheSecret = process.env.CACHE_REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = SANITY_SECRET;
    process.env.CACHE_REVALIDATE_SECRET = CACHE_SECRET;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "redshirtsports.com";
  });

  afterEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = originalSanitySecret;
    process.env.CACHE_REVALIDATE_SECRET = originalCacheSecret;
    vi.resetModules();
    mockRevalidateTag.mockReset();
  });

  it("returns 500 when Sanity secret env is missing for tags", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        body: JSON.stringify({ secret: "x", tags: ["post"] }),
      }) as never,
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 when cache secret env is missing for cacheTags", async () => {
    delete process.env.CACHE_REVALIDATE_SECRET;
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "x",
          cacheTags: ["rankings"],
        }),
      }) as never,
    );
    expect(res.status).toBe(500);
  });

  it("returns 401 for invalid Sanity secret", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "wrong", tags: ["post"] }),
      }) as never,
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when cacheTags uses the Sanity secret", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SANITY_SECRET,
          cacheTags: ["rankings"],
        }),
      }) as never,
    );
    expect(res.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("returns 400 when tags are missing", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SANITY_SECRET }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when tags is present but not an array", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SANITY_SECRET,
          tags: "post",
        }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for mixed tags and cacheTags", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SANITY_SECRET,
          tags: ["post"],
          cacheTags: ["rankings"],
        }),
      }) as never,
    );
    expect(res.status).toBe(400);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("returns 400 when cacheTags are not rankings*", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: CACHE_SECRET,
          cacheTags: ["rankings", "posts"],
        }),
      }) as never,
    );
    expect(res.status).toBe(400);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 when JSON body has no secret", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["post"] }),
      }) as never,
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON with no tags", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        body: "not-json",
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("revalidates Sanity tags with a sanity: prefix", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SANITY_SECRET,
          tags: ["post", "author"],
        }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:post", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:author", "max");
    await expect(res.json()).resolves.toEqual({
      service: "redshirtsports.com",
      tags: ["post", "author"],
      cacheTags: [],
    });
  });

  it("prefixes rankings values in tags as Sanity ids", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SANITY_SECRET,
          tags: ["rankings"],
        }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:rankings", {
      expire: 0,
    });
  });

  it("revalidates allowlisted cacheTags without a sanity prefix", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: CACHE_SECRET,
          cacheTags: ["rankings", "rankings:football:fbs:2026:1"],
        }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "rankings:football:fbs:2026:1",
      { expire: 0 },
    );
    await expect(res.json()).resolves.toEqual({
      service: "redshirtsports.com",
      tags: [],
      cacheTags: ["rankings", "rankings:football:fbs:2026:1"],
    });
  });
});
