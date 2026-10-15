import { describe, expect, it } from "vitest";

import { validateFeaturedImageRef } from "./featured-image";

describe("validateFeaturedImageRef", () => {
  it("accepts a 1920×1080 asset", () => {
    expect(validateFeaturedImageRef("image-abc-1920x1080-webp")).toBe(true);
  });

  it("accepts a larger 16:9 asset", () => {
    expect(validateFeaturedImageRef("image-abc-3840x2160-jpg")).toBe(true);
  });

  it("rejects images under 1920×1080", () => {
    expect(validateFeaturedImageRef("image-abc-1280x720-webp")).toMatch(/1920/);
  });

  it("rejects images that are not 16:9", () => {
    expect(validateFeaturedImageRef("image-abc-1920x1200-webp")).toMatch(
      /16:9/,
    );
  });

  it("rejects refs that do not include dimensions", () => {
    expect(validateFeaturedImageRef("image-abc-webp")).toMatch(/1920/);
  });
});
