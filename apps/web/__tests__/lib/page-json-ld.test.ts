import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";

describe("buildIndexedPageJsonLd", () => {
  it("builds a webpage with an absolute breadcrumb trail", () => {
    const data = buildIndexedPageJsonLd({
      name: "How our Top 25 polls work",
      description: "The rules.",
      path: "rankings/methodology",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Methodology", path: "/rankings/methodology" },
      ],
    });

    expect(data["@type"]).toBe("WebPage");
    expect(data.url).toMatch(/\/rankings\/methodology$/);
    expect(data.mainEntity).toBeUndefined();
    const breadcrumb = data.breadcrumb as {
      itemListElement?: Array<{ name?: string; item?: string }>;
    };
    expect(breadcrumb.itemListElement?.[0]?.item).not.toMatch(/\/$/);
    expect(breadcrumb.itemListElement?.[1]?.name).toBe("Methodology");
  });

  it("builds a collection page item list", () => {
    const data = buildIndexedPageJsonLd({
      pageType: "CollectionPage",
      name: "College Teams",
      path: "/college/teams",
      breadcrumbs: [{ name: "Teams", path: "/college/teams" }],
      items: [{ name: "Alabama", path: "/college/teams/alabama" }],
    });

    expect(data["@type"]).toBe("CollectionPage");
    const list = data.mainEntity as {
      numberOfItems?: number;
      itemListElement?: Array<{ url?: string }>;
    };
    expect(list.numberOfItems).toBe(1);
    expect(list.itemListElement?.[0]?.url).toContain("/college/teams/alabama");
  });
});
