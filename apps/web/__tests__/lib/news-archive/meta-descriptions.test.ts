import {
  META_DESCRIPTION_MAX_LENGTH,
  trimMetaDescription,
} from "@/lib/meta-description";
import {
  collegeNewsMetaDescription,
  conferenceNewsMetaDescription,
  divisionNewsMetaDescription,
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

  it("fits 155 characters without an ellipsis, even for long names", () => {
    for (const description of [
      collegeNewsMetaDescription(1),
      collegeNewsMetaDescription(12),
      sportNewsMetaDescription("Women's Basketball", 1),
      sportNewsMetaDescription("Women's Basketball", 12),
      divisionNewsMetaDescription("Power Conferences", "Women's Basketball", 1),
      divisionNewsMetaDescription(
        "Power Conferences",
        "Women's Basketball",
        12,
      ),
      conferenceNewsMetaDescription(
        "Southwestern Athletic Conference",
        "FCS",
        "Football",
        1,
      ),
      conferenceNewsMetaDescription(
        "Missouri Valley Conference",
        "Mid-Major",
        "Women's Basketball",
        12,
      ),
    ]) {
      expect(description.length).toBeLessThanOrEqual(155);
      expect(description).not.toContain("…");
      expect(description).not.toMatch(/go-to|go to/);
    }
  });
});
