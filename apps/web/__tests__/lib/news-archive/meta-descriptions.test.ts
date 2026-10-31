import {
  META_DESCRIPTION_MAX_LENGTH,
  trimMetaDescription,
} from "@/lib/meta-description";
import {
  collegeNewsMetaDescription,
  sportNewsMetaDescription,
} from "@/lib/news-archive/meta-descriptions";

describe("trimMetaDescription", () => {
  it("trims long text at a word boundary", () => {
    const long = "word ".repeat(40).trim();
    const result = trimMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
  });

  it("leaves short text unchanged", () => {
    const text = "Short description.";
    expect(trimMetaDescription(text)).toBe(text);
  });
});

describe("news archive meta descriptions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("targets SERP length for college and sport news page 1", () => {
    for (const description of [
      collegeNewsMetaDescription(1),
      sportNewsMetaDescription("College Football", 1),
    ]) {
      expect(description.length).toBeGreaterThanOrEqual(120);
      expect(description.length).toBeLessThanOrEqual(
        META_DESCRIPTION_MAX_LENGTH,
      );
    }
  });

  it("includes page number on paginated archives", () => {
    expect(collegeNewsMetaDescription(3)).toContain("Page 3");
    expect(sportNewsMetaDescription("College Football", 2)).toContain("Page 2");
  });
});
