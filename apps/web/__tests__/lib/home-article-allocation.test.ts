import { describe, expect, it } from "vitest";

import {
  allocateArticles,
  HOME_SECTION_LIMITS,
} from "@/lib/home-article-allocation";

describe("allocateArticles", () => {
  const articles = [
    { _id: "a", title: "A" },
    { _id: "b", title: "B" },
    { _id: "c", title: "C" },
    { _id: "d", title: "D" },
  ];

  it("returns unique articles up to the limit", () => {
    const usedIds = new Set<string>();

    expect(allocateArticles(articles, usedIds, 2)).toEqual([
      { _id: "a", title: "A" },
      { _id: "b", title: "B" },
    ]);
    expect(usedIds).toEqual(new Set(["a", "b"]));
  });

  it("skips articles already used in earlier sections", () => {
    const usedIds = new Set(["a", "b"]);

    expect(allocateArticles(articles, usedIds, 2)).toEqual([
      { _id: "c", title: "C" },
      { _id: "d", title: "D" },
    ]);
    expect(usedIds).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("exposes homepage section limits", () => {
    expect(HOME_SECTION_LIMITS.megaboard).toBe(5);
    expect(HOME_SECTION_LIMITS.transfer).toBe(2);
  });
});
