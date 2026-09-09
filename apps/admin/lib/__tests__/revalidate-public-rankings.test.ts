import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockEnv } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockEnv: { SANITY_REVALIDATE_SECRET: undefined as string | undefined },
}));

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/env", () => ({
  env: mockEnv,
}));

vi.mock("@/lib/site", () => ({
  PUBLIC_SITE_URL: "https://www.redshirtsports.com",
}));

describe("revalidatePublicPollRankingsCache", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockEnv.SANITY_REVALIDATE_SECRET = undefined;
    vi.resetModules();
  });

  it("no-ops when secret is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { revalidatePublicPollRankingsCache } = await import(
      "@/lib/revalidate-public-rankings"
    );

    await revalidatePublicPollRankingsCache();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("posts cacheTags to the public revalidate endpoint", async () => {
    mockEnv.SANITY_REVALIDATE_SECRET = "shared-secret";
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    const { revalidatePublicPollRankingsCache } = await import(
      "@/lib/revalidate-public-rankings"
    );

    await revalidatePublicPollRankingsCache();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.redshirtsports.com/api/revalidate-tags",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "shared-secret",
          cacheTags: ["poll-rankings"],
        }),
      },
    );
  });

  it("logs when the public endpoint returns an error", async () => {
    mockEnv.SANITY_REVALIDATE_SECRET = "shared-secret";
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { revalidatePublicPollRankingsCache } = await import(
      "@/lib/revalidate-public-rankings"
    );

    await revalidatePublicPollRankingsCache();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
