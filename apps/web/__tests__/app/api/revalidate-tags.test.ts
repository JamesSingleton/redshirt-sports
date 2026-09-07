const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock("@/env", () => ({
  env: {
    get SANITY_REVALIDATE_SECRET() {
      return process.env.SANITY_REVALIDATE_SECRET;
    },
  },
}));

describe("POST /api/revalidate-tags", () => {
  const originalSecret = process.env.SANITY_REVALIDATE_SECRET;

  afterEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = originalSecret;
    vi.resetModules();
    mockRevalidateTag.mockReset();
  });

  it("returns 500 when secret env is missing", async () => {
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

  it("returns 401 for invalid secret", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
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

  it("returns 400 when tags are missing", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "correct-secret" }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when tags is present but not an array", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "correct-secret",
          tags: "post",
        }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when JSON body has no secret", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
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

  it("handles invalid JSON body as unauthorized when secret missing from body", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        body: "not-json",
      }) as never,
    );
    expect(res.status).toBe(401);
  });

  it("revalidates provided tags on success", async () => {
    process.env.SANITY_REVALIDATE_SECRET = "correct-secret";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "redshirtsports.com";
    vi.resetModules();
    const { POST } = await import("@/app/api/revalidate-tags/route");

    const res = await POST(
      new Request("https://example.com/api/revalidate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "correct-secret",
          tags: ["post", "author"],
        }),
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:post", {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:author", {
      expire: 0,
    });
    await expect(res.json()).resolves.toEqual({
      service: "redshirtsports.com",
      tags: ["post", "author"],
    });
  });
});
