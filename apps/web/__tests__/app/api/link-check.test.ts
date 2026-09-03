const { mockAssertPublicHttpUrl, mockResolveLinkCheckTarget } = vi.hoisted(
  () => ({
    mockAssertPublicHttpUrl: vi.fn(),
    mockResolveLinkCheckTarget: vi.fn(),
  }),
);

vi.mock("@/lib/link-check-url", () => ({
  assertPublicHttpUrl: mockAssertPublicHttpUrl,
  resolveLinkCheckTarget: mockResolveLinkCheckTarget,
}));

import { GET, OPTIONS } from "@/app/api/link-check/route";

const STUDIO_ORIGIN = "http://localhost:3333";

function makeRequest(
  url: string,
  origin: string | null = STUDIO_ORIGIN,
): Request {
  const headers = new Headers();
  const request = new Request(url, { headers });
  vi.spyOn(request.headers, "get").mockImplementation((name: string) => {
    if (name.toLowerCase() === "origin") return origin;
    return headers.get(name);
  });
  return request;
}

describe("GET /api/link-check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertPublicHttpUrl.mockResolvedValue(undefined);
    mockResolveLinkCheckTarget.mockReturnValue(new URL("https://example.com"));
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 403 for non-studio origins", async () => {
    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
        "https://evil.example",
      ),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      message: "Forbidden",
    });
  });

  it("returns 403 when origin is missing", async () => {
    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
        null,
      ),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when url param is missing", async () => {
    const res = await GET(
      makeRequest("https://www.redshirtsports.com/api/link-check"),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Missing url parameter",
    });
  });

  it("returns 400 when target URL is invalid", async () => {
    mockResolveLinkCheckTarget.mockReturnValue(null);
    const res = await GET(
      makeRequest("https://www.redshirtsports.com/api/link-check?url=bad"),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "Invalid URL" });
  });

  it("returns ok for a successful HEAD response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      status: 200,
      finalUrl: "https://example.com/",
      message: undefined,
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(STUDIO_ORIGIN);
  });

  it("falls back to GET when HEAD returns 405", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    await expect(res.json()).resolves.toMatchObject({ ok: true, status: 200 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1]?.[1]).toMatchObject({
      method: "GET",
    });
  });

  it("falls back to GET when HEAD returns 501", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 501 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      status: 404,
      message: "HTTP 404",
    });
  });

  it("follows redirects until a non-redirect status", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com/final" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      finalUrl: "https://example.com/final",
    });
  });

  it("stops following redirects when location header is missing", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 301 }));

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: 301,
      finalUrl: "https://example.com/",
    });
  });

  it("returns 400 when assertPublicHttpUrl rejects Invalid URL", async () => {
    mockAssertPublicHttpUrl.mockRejectedValue(new Error("Invalid URL"));
    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("returns 502 Request timed out when fetch aborts", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.mocked(fetch).mockRejectedValue(abortError);

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Request timed out",
    });
  });

  it("returns 502 Request timed out on AbortError", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockAssertPublicHttpUrl.mockRejectedValue(abortError);

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Request timed out",
    });
  });

  it("returns 502 with error message for other Errors", async () => {
    mockAssertPublicHttpUrl.mockRejectedValue(new Error("Too many redirects"));
    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Too many redirects",
    });
  });

  it("returns 502 Failed to fetch for non-Error throws", async () => {
    mockAssertPublicHttpUrl.mockRejectedValue("boom");
    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Failed to fetch",
    });
  });

  it("aborts slow fetch requests via fetchWithTimeout", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const responsePromise = GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );

    await vi.advanceTimersByTimeAsync(5000);
    const res = await responsePromise;

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Request timed out",
    });
    vi.useRealTimers();
  });

  it("throws Too many redirects after exceeding MAX_REDIRECTS", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://example.com/loop" },
      }),
    );

    const res = await GET(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check?url=https://example.com",
      ),
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      message: "Too many redirects",
    });
  });
});

describe("OPTIONS /api/link-check", () => {
  it("returns 204 with CORS headers for studio origin", async () => {
    const res = await OPTIONS(
      makeRequest("https://www.redshirtsports.com/api/link-check"),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(STUDIO_ORIGIN);
  });

  it("returns 204 without CORS for unknown origin", async () => {
    const res = await OPTIONS(
      makeRequest(
        "https://www.redshirtsports.com/api/link-check",
        "https://evil.example",
      ),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
