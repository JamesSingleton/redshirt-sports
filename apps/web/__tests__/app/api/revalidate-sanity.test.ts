const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

describe("POST /api/revalidate/sanity", () => {
  const original = process.env.SANITY_REVALIDATE_SECRET;

  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = "sanity-secret";
    mockRevalidateTag.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = original;
  });

  async function post(init: RequestInit) {
    const { POST } = await import("@/app/api/revalidate/sanity/route");
    return POST(
      new Request("https://example.com/api/revalidate/sanity", {
        method: "POST",
        ...init,
      }),
    );
  }

  it("revalidates sanity:_type", async () => {
    const res = await post({
      headers: { "x-revalidate-secret": "sanity-secret" },
      body: JSON.stringify({ _type: "post" }),
    });
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:post", "max");
  });

  it("accepts the secret in the JSON body", async () => {
    const res = await post({
      body: JSON.stringify({ secret: "sanity-secret", _type: "page" }),
    });
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("sanity:page", "max");
  });

  it("rejects a bad secret", async () => {
    const res = await post({
      headers: { "x-revalidate-secret": "nope" },
      body: JSON.stringify({ _type: "post" }),
    });
    expect(res.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a request with no secret", async () => {
    const res = await post({
      body: JSON.stringify({ _type: "post" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects a body without a string _type", async () => {
    const missing = await post({
      headers: { "x-revalidate-secret": "sanity-secret" },
      body: JSON.stringify({}),
    });
    expect(missing.status).toBe(400);

    const empty = await post({
      headers: { "x-revalidate-secret": "sanity-secret" },
      body: JSON.stringify({ _type: "" }),
    });
    expect(empty.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const res = await post({
      headers: { "x-revalidate-secret": "sanity-secret" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("returns 500 when the secret is not configured", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post({
      body: JSON.stringify({ _type: "post" }),
    });
    expect(res.status).toBe(500);
    error.mockRestore();
  });
});
