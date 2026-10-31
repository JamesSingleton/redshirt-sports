import {
  getBrandName,
  META_DESCRIPTION_MAX_LENGTH,
  trimMetaDescription,
} from "@/lib/meta-description";
import { SITE_BRAND } from "@/lib/seo";

describe("getBrandName", () => {
  it("uses NEXT_PUBLIC_APP_NAME when set", () => {
    process.env.NEXT_PUBLIC_APP_NAME = "Custom Brand";
    expect(getBrandName()).toBe("Custom Brand");
  });

  it("falls back to SITE_BRAND", () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    expect(getBrandName()).toBe(SITE_BRAND);
  });
});

describe("trimMetaDescription", () => {
  it("normalizes whitespace", () => {
    expect(trimMetaDescription("  hello   world  ")).toBe("hello world");
  });

  it("truncates at a word boundary when possible", () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    const result = trimMetaDescription(words);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("word29");
  });

  it("hard-truncates when no word boundary is late enough", () => {
    const longToken = "x".repeat(META_DESCRIPTION_MAX_LENGTH + 20);
    const result = trimMetaDescription(longToken);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
  });
});
