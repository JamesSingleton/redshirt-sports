import { describe, expect, it } from "vitest";

import { getArticleRelatedPosts } from "@/lib/article-related";

describe("getArticleRelatedPosts", () => {
  const basePost = {
    _id: "post-1",
    title: "Current",
    slug: "current",
    publishedAt: "2026-10-10T12:00:00Z",
  };

  it("returns related posts with slugs up to the limit", () => {
    const result = getArticleRelatedPosts({
      ...basePost,
      relatedPosts: [
        { _id: "r1", title: "One", slug: "one", tagNames: ["News"] },
        { _id: "r2", title: "Two", slug: "two" },
        { _id: "r3", title: "Three", slug: "three" },
        { _id: "r4", title: "Four", slug: "four" },
      ],
    } as never);

    expect(result).toHaveLength(3);
    expect(result.map((p) => p.slug)).toEqual(["one", "two", "three"]);
  });

  it("adds upNextInFeed when related list is short", () => {
    const result = getArticleRelatedPosts({
      ...basePost,
      relatedPosts: [{ _id: "r1", title: "Related", slug: "related" }],
      upNextInFeed: {
        _id: "feed",
        title: "Older",
        slug: "older",
        division: { name: "FCS" },
      },
    } as never);

    expect(result).toHaveLength(2);
    expect(result[1]?.slug).toBe("older");
  });

  it("dedupes upNextInFeed when already in related", () => {
    const result = getArticleRelatedPosts({
      ...basePost,
      relatedPosts: [{ _id: "same", title: "Same", slug: "same" }],
      upNextInFeed: { _id: "same", title: "Same", slug: "same" },
    } as never);

    expect(result).toHaveLength(1);
  });
});
