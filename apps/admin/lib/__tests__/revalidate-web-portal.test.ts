import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch, mockEnv } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockEnv: {
    CACHE_REVALIDATE_SECRET: undefined as string | undefined,
    NEXT_PUBLIC_SITE_URL: "https://www.redshirtsports.com" as
      | string
      | undefined,
  },
}));

vi.stubGlobal("fetch", mockFetch);
vi.mock("@/env", () => ({ env: mockEnv }));

import { expireWebPortalTags } from "@/lib/revalidate-web-portal";

describe("expireWebPortalTags", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockEnv.CACHE_REVALIDATE_SECRET = "s";
  });

  it("does nothing for no tags", async () => {
    await expireWebPortalTags([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws without the secret so the push stays unconfirmed", async () => {
    mockEnv.CACHE_REVALIDATE_SECRET = undefined;
    await expect(expireWebPortalTags(["player:1"])).rejects.toThrow(
      /CACHE_REVALIDATE_SECRET/,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("posts the tags to the web app", async () => {
    mockFetch.mockResolvedValue(new Response("{}", { status: 200 }));
    await expireWebPortalTags(["portal:players", "player:100000"]);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.redshirtsports.com/api/revalidate-tags");
    expect(JSON.parse(String(init.body))).toEqual({
      secret: "s",
      cacheTags: ["portal:players", "player:100000"],
    });
  });

  it("throws when the web app refuses", async () => {
    mockFetch.mockResolvedValue(new Response("nope", { status: 401 }));
    await expect(expireWebPortalTags(["player:1"])).rejects.toThrow(
      "Site cache refresh failed (401): nope",
    );
  });
});
