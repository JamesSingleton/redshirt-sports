import { describe, expect, it } from "vitest";

import { parseStorySlug } from "./story";

describe("parseStorySlug", () => {
  it("takes a slug or the article's URL", () => {
    expect(parseStorySlug("portal-qb-visits-idaho")).toBe(
      "portal-qb-visits-idaho",
    );
    expect(
      parseStorySlug(
        " https://www.redshirtsports.com/portal-qb-visits-idaho/ ",
      ),
    ).toBe("portal-qb-visits-idaho");
    expect(parseStorySlug("/portal-qb-visits-idaho?utm=x")).toBeUndefined();
    expect(
      parseStorySlug("https://redshirtsports.com/portal-qb?utm_source=x#top"),
    ).toBe("portal-qb");
  });

  it("is null for blank and undefined for anything else", () => {
    expect(parseStorySlug("")).toBeNull();
    expect(parseStorySlug("   ")).toBeNull();
    expect(parseStorySlug(null)).toBeNull();
    expect(parseStorySlug(undefined)).toBeNull();
    expect(parseStorySlug("Some Story Title")).toBeUndefined();
    expect(
      parseStorySlug("https://redshirtsports.com/college/news"),
    ).toBeUndefined();
    expect(parseStorySlug("https://")).toBeUndefined();
    expect(parseStorySlug("a".repeat(201))).toBeUndefined();
    expect(parseStorySlug("a".repeat(501))).toBeUndefined();
    expect(parseStorySlug("///portal-qb///")).toBe("portal-qb");
    expect(parseStorySlug("////")).toBeUndefined();
  });

  it("stays fast on hostile input", () => {
    // Many slashes then a non-slash: quadratic for a /\/+$/ regex.
    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      parseStorySlug(`${"/".repeat(499)}x`);
      parseStorySlug(`a${"/".repeat(498)}b`);
    }
    expect(performance.now() - start).toBeLessThan(250);
  });
});
