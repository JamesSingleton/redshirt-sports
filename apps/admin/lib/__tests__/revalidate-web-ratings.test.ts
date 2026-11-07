import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockEnv } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockEnv: {
    CACHE_REVALIDATE_SECRET: undefined as string | undefined,
    NEXT_PUBLIC_SITE_URL: undefined as string | undefined,
  },
}));

vi.stubGlobal("fetch", mockFetch);
vi.mock("@/env", () => ({ env: mockEnv }));

describe("revalidateWebRatingsCache", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockEnv.CACHE_REVALIDATE_SECRET = undefined;
    mockEnv.NEXT_PUBLIC_SITE_URL = "https://www.redshirtsports.xyz";
    vi.resetModules();
  });

  it("no-ops without the secret", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { revalidateWebRatingsCache } = await import(
      "@/lib/revalidate-web-ratings"
    );
    await revalidateWebRatingsCache("football", "fcs");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("expires the pool's ratings tags on the web app", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "s";
    mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
    const { revalidateWebRatingsCache } = await import(
      "@/lib/revalidate-web-ratings"
    );
    await revalidateWebRatingsCache("football", "fcs");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/revalidate-tags$/);
    expect(JSON.parse(String(init.body))).toEqual({
      secret: "s",
      cacheTags: [
        "ratings:football:fcs",
        "ratings:pools",
        "ratings:sport:football",
      ],
    });
  });

  it("also expires every ratings entry when a pool's visibility changes", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "s";
    mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
    const { revalidateWebRatingsCache } = await import(
      "@/lib/revalidate-web-ratings"
    );
    await revalidateWebRatingsCache("football", "fcs", {
      visibilityChanged: true,
    });
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).cacheTags).toContain("ratings");
  });

  it("logs, but doesn't throw, when the web app fails", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = "s";
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    const { revalidateWebRatingsCache } = await import(
      "@/lib/revalidate-web-ratings"
    );
    await revalidateWebRatingsCache("football", "fcs");
    mockFetch.mockRejectedValueOnce(new Error("down"));
    await revalidateWebRatingsCache("football", "fcs");
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });
});
