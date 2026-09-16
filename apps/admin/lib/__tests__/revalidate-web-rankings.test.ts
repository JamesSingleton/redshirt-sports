import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockEnv } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockEnv: {
    CACHE_REVALIDATE_SECRET: undefined as string | undefined,
    NEXT_PUBLIC_SITE_URL: undefined as string | undefined,
  },
}));

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/env", () => ({
  env: mockEnv,
}));

vi.mock("@/lib/site", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/site")>("@/lib/site");
  return actual;
});

describe("revalidateWebRankingsCache", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockEnv.CACHE_REVALIDATE_SECRET = undefined;
    mockEnv.NEXT_PUBLIC_SITE_URL = undefined;
    vi.resetModules();
  });

  it("no-ops when secret is missing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { revalidateWebRankingsCache } = await import(
      "@/lib/revalidate-web-rankings"
    );

    await revalidateWebRankingsCache({
      sport: "football",
      division: "fbs",
      year: 2026,
      weekKey: "2-1",
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("no-ops on invalid weekKey", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "shared-secret";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { revalidateWebRankingsCache } = await import(
      "@/lib/revalidate-web-rankings"
    );

    await revalidateWebRankingsCache({
      sport: "football",
      division: "fbs",
      year: 2026,
      weekKey: "not-a-week",
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("posts cacheTags to the hardcoded public site when env is unset", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "shared-secret";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    const { revalidateWebRankingsCache } = await import(
      "@/lib/revalidate-web-rankings"
    );

    await revalidateWebRankingsCache({
      sport: "football",
      division: "fbs",
      year: 2026,
      weekKey: "2-1",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.redshirtsports.com/api/revalidate-tags",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          secret: "shared-secret",
          cacheTags: [
            "rankings",
            "rankings:football",
            "rankings:football:fbs",
            "rankings:football:fbs:2026:1",
            "rankings:fbs:years",
            "rankings:fbs:2026:weeks",
          ],
        }),
      }),
    );
  });

  it("normalizes host-only NEXT_PUBLIC_SITE_URL with https", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "shared-secret";
    mockEnv.NEXT_PUBLIC_SITE_URL = "www.redshirtsports.xyz";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    const { revalidateWebRankingsCache } = await import(
      "@/lib/revalidate-web-rankings"
    );

    await revalidateWebRankingsCache({
      sport: "football",
      division: "fbs",
      year: 2026,
      weekKey: "2-1",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.redshirtsports.xyz/api/revalidate-tags",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("logs when the public endpoint returns an error", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "shared-secret";
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { revalidateWebRankingsCache } = await import(
      "@/lib/revalidate-web-rankings"
    );

    await revalidateWebRankingsCache({
      sport: "football",
      division: "fbs",
      year: 2026,
      weekKey: "2-1",
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("resolvePublicSiteUrl", () => {
  it("adds https for host-only values", async () => {
    const { resolvePublicSiteUrl } = await import("@/lib/site");
    expect(resolvePublicSiteUrl("www.redshirtsports.xyz")).toBe(
      "https://www.redshirtsports.xyz",
    );
  });

  it("keeps an explicit scheme", async () => {
    const { resolvePublicSiteUrl } = await import("@/lib/site");
    expect(resolvePublicSiteUrl("https://preview.example.com/")).toBe(
      "https://preview.example.com",
    );
  });

  it("falls back when unset", async () => {
    const { PUBLIC_SITE_URL, resolvePublicSiteUrl } = await import(
      "@/lib/site"
    );
    expect(resolvePublicSiteUrl(undefined)).toBe(PUBLIC_SITE_URL);
  });
});
