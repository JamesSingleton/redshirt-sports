import { getArticleTagNames } from "@/lib/article-seo";

describe("getArticleTagNames", () => {
  it("returns tag names and filters empty values", () => {
    expect(
      getArticleTagNames([
        { name: "Recruiting" },
        { name: null },
        { name: "Quarterbacks" },
      ]),
    ).toEqual(["Recruiting", "Quarterbacks"]);
  });

  it("returns an empty array when tags are missing", () => {
    expect(getArticleTagNames(null)).toEqual([]);
    expect(getArticleTagNames(undefined)).toEqual([]);
  });
});
