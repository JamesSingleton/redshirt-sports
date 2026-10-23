import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@redshirt-sports/analytics/keys", () => ({
  keys: () => ({ NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com" }),
}));

import {
  fetchMostReadPathnames,
  pathnameToArticleSlug,
} from "@/lib/posthog-most-read";

describe("pathnameToArticleSlug", () => {
  it("returns root-level article slugs only", () => {
    expect(pathnameToArticleSlug("/my-article")).toBe("my-article");
    expect(pathnameToArticleSlug("my-article")).toBe("my-article");
    expect(pathnameToArticleSlug("/college/football/news")).toBeNull();
    expect(pathnameToArticleSlug("/")).toBeNull();
  });
});

describe("fetchMostReadPathnames", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty when PostHog credentials are missing", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "");
    vi.stubEnv("POSTHOG_PROJECT_ID", "");
    await expect(fetchMostReadPathnames()).resolves.toEqual([]);
  });

  it("fetches and normalizes pathnames", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    vi.stubEnv("POSTHOG_PROJECT_ID", "1");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          ["/story-one/", 10],
          ["/", 1],
          [123, 2],
        ] as Array<[string, number]>,
      }),
    } as Response);

    await expect(fetchMostReadPathnames(5)).resolves.toEqual(["/story-one"]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://us.posthog.com/api/projects/1/query/",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns empty on failed responses", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    vi.stubEnv("POSTHOG_PROJECT_ID", "1");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
    } as Response);
    await expect(fetchMostReadPathnames()).resolves.toEqual([]);
  });
});
