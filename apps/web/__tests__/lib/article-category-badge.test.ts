import { describe, expect, it } from "vitest";

import { getArticleCategoryBadge } from "@/lib/article-category-badge";

describe("getArticleCategoryBadge", () => {
  it("prefers sport with a link to sport news", () => {
    expect(
      getArticleCategoryBadge(
        { title: "Football", slug: "football" },
        "recruiting",
      ),
    ).toEqual({
      label: "Football",
      href: "/college/football/news",
    });
  });

  it("falls back to story type without a link", () => {
    expect(getArticleCategoryBadge(null, "recruiting")).toEqual({
      label: "Recruiting",
    });
  });

  it("returns null when sport and story type are missing", () => {
    expect(getArticleCategoryBadge(null, null)).toBeNull();
    expect(getArticleCategoryBadge({ title: "Football" }, null)).toBeNull();
  });
});
