import { featuredArticleGridClass } from "@/lib/featured-article-grid";

describe("featuredArticleGridClass", () => {
  it("uses one column for a single article", () => {
    expect(featuredArticleGridClass(1, 3)).toContain("md:grid-cols-1");
  });

  it("uses two columns when only two articles are available", () => {
    expect(featuredArticleGridClass(2, 3)).toContain("md:grid-cols-2");
    expect(featuredArticleGridClass(2, 3)).not.toContain("md:grid-cols-3");
  });

  it("caps at the layout maximum", () => {
    expect(featuredArticleGridClass(4, 2)).toContain("md:grid-cols-2");
    expect(featuredArticleGridClass(3, 3)).toContain("md:grid-cols-3");
  });
});
