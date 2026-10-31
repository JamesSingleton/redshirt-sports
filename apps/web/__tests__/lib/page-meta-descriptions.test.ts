import {
  contactPageMetaDescription,
  personArchiveMetaDescription,
  searchPageMetaDescription,
} from "@/lib/page-meta-descriptions";

describe("page meta descriptions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("builds paginated person archive copy", () => {
    const description = personArchiveMetaDescription({
      name: "Jane Doe",
      roles: "Senior Writer",
      pageIndex: 2,
    });
    expect(description).toContain("Page 2");
    expect(description).toContain("Jane Doe");
  });

  it("prefers a long biography on page 1", () => {
    const bio = `${"Insightful coverage. ".repeat(12)}`.trim();
    const description = personArchiveMetaDescription({
      name: "Jane Doe",
      roles: "Senior Writer",
      biography: bio,
      pageIndex: 1,
    });
    expect(description.startsWith("Insightful")).toBe(true);
  });

  it("uses default person copy when biography is short", () => {
    const description = personArchiveMetaDescription({
      name: "Jane Doe",
      roles: "Senior Writer",
      biography: "Short bio.",
      pageIndex: 1,
    });
    expect(description).toContain("Read articles by Jane Doe");
  });

  it("builds search and contact descriptions", () => {
    expect(searchPageMetaDescription()).toContain("Search Redshirt Sports");
    expect(contactPageMetaDescription()).toContain("Contact Redshirt Sports");
  });
});
