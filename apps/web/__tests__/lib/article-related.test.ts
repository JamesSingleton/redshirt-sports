import { describe, expect, it } from "vitest";

import { getArticleRelatedPosts } from "@/lib/article-related";

describe("getArticleRelatedPosts", () => {
  it("skips related sources without slugs", () => {
    expect(
      getArticleRelatedPosts({
        _id: "current",
        relatedPosts: [{ _id: "r1", title: "X", slug: null }],
      } as never),
    ).toEqual([]);
    expect(
      getArticleRelatedPosts({
        _id: "current",
        upNextInFeed: { _id: "u1", title: "Up", slug: null },
      } as never),
    ).toEqual([]);
  });

  it("dedupes related posts and up next", () => {
    const post = {
      _id: "current",
      relatedPosts: [
        {
          _id: "r1",
          title: "One",
          slug: "one",
          sportSubgrouping: { shortName: "FBS" },
        },
        {
          _id: "r2",
          title: "Two",
          slug: null,
        },
        {
          _id: "r3",
          title: "Three",
          slug: "three",
        },
      ],
      upNextInFeed: {
        _id: "r1",
        title: "One duplicate",
        slug: "one-dup",
      },
    } as never;

    const related = getArticleRelatedPosts(post, 1);
    expect(related).toHaveLength(1);
    expect(related[0]?.slug).toBe("one");
  });

  it("uses subgrouping and division labels in kickers", () => {
    const post = {
      _id: "current",
      relatedPosts: [
        {
          _id: "r3",
          title: "Three",
          slug: "three",
          sportSubgrouping: { name: "FCS" },
        },
        {
          _id: "r4",
          title: "Four",
          slug: "four",
          division: { name: "Division I" },
        },
      ],
    } as never;
    const related = getArticleRelatedPosts(post, 5);
    expect(related[0]?.kicker).toBe("FCS");
    expect(related[1]?.kicker).toBe("Division I");
  });
});
