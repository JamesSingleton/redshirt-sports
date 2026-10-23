const { mockFetchMostReadPathnames, mockSanityFetch } = vi.hoisted(() => ({
  mockFetchMostReadPathnames: vi.fn(),
  mockSanityFetch: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published" },
  sanityFetch: mockSanityFetch,
}));

vi.mock("@/lib/posthog-most-read", () => ({
  fetchMostReadPathnames: mockFetchMostReadPathnames,
  pathnameToArticleSlug: (pathname: string) =>
    pathname.replace(/^\//, "").split("/")[0] ?? null,
}));

import { beforeEach, describe, expect, it } from "vitest";

import { getCachedMostReadPosts } from "@/lib/most-read-data";

describe("getCachedMostReadPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMostReadPathnames.mockResolvedValue(["/story-a", "/story-b"]);
    mockSanityFetch.mockResolvedValue({ data: [] });
  });

  it("returns ordered posts when slugs resolve", async () => {
    mockSanityFetch.mockResolvedValueOnce({
      data: [
        { _id: "1", title: "A", slug: "story-a" },
        { _id: "2", title: "B", slug: "story-b" },
      ],
    });
    await expect(getCachedMostReadPosts()).resolves.toEqual([
      { _id: "1", title: "A", slug: "story-a" },
      { _id: "2", title: "B", slug: "story-b" },
    ]);
  });

  it("treats null Sanity payloads as empty", async () => {
    mockSanityFetch
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });
    await expect(getCachedMostReadPosts()).resolves.toEqual([]);
  });

  it("dedupes duplicate slugs from analytics", async () => {
    mockFetchMostReadPathnames.mockResolvedValue(["/story-a", "/story-a"]);
    mockSanityFetch.mockResolvedValueOnce({
      data: [{ _id: "1", title: "A", slug: "story-a" }],
    });
    await expect(getCachedMostReadPosts()).resolves.toEqual([
      { _id: "1", title: "A", slug: "story-a" },
    ]);
  });

  it("falls back when analytics slugs do not match Sanity posts", async () => {
    mockSanityFetch.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
      data: [{ _id: "f1", title: "Fallback", slug: "fallback" }],
    });
    await expect(getCachedMostReadPosts()).resolves.toEqual([
      { _id: "f1", title: "Fallback", slug: "fallback" },
    ]);
  });

  it("falls back when analytics returns no pathnames", async () => {
    mockFetchMostReadPathnames.mockResolvedValue([]);
    mockSanityFetch.mockResolvedValueOnce({
      data: [{ _id: "f1", title: "Fallback", slug: "fallback" }],
    });
    await expect(getCachedMostReadPosts()).resolves.toEqual([
      { _id: "f1", title: "Fallback", slug: "fallback" },
    ]);
  });

  it("falls back when PostHog slugs miss", async () => {
    mockSanityFetch.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
      data: [{ _id: "f1", title: "Fallback", slug: "fallback" }],
    });
    await expect(getCachedMostReadPosts()).resolves.toEqual([
      { _id: "f1", title: "Fallback", slug: "fallback" },
    ]);
  });
});
