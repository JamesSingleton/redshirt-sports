import { describe, expect, it } from "vitest";

import { runEditorialRules } from "../checks/editorial/rules";

describe("runEditorialRules", () => {
  const baseDocument = {
    title: "A solid article title for testing purposes",
    excerpt: "A".repeat(150),
    slug: { current: "test-article" },
    image: { _type: "image" },
    body: [],
  };

  it("omits SEO description check when override is empty", () => {
    const results = runEditorialRules(baseDocument);

    expect(results.some((result) => result.id === "seoDescription")).toBe(
      false,
    );
  });

  it("checks SEO description only when override is populated", () => {
    const results = runEditorialRules({
      ...baseDocument,
      seoDescription: "A".repeat(170),
    });

    expect(
      results.find((result) => result.id === "seoDescription"),
    ).toMatchObject({
      status: "warning",
    });
  });

  it("omits YouTube and Twitter checks when no embeds are present", () => {
    const results = runEditorialRules(baseDocument);

    expect(results.some((result) => result.id === "youtubeUrls")).toBe(false);
    expect(results.some((result) => result.id === "twitterEmbeds")).toBe(false);
  });

  it("validates Twitter embed IDs when twitter blocks are present", () => {
    const results = runEditorialRules({
      ...baseDocument,
      body: [{ _type: "twitter", id: "" }],
    });

    expect(
      results.find((result) => result.id === "twitterEmbeds"),
    ).toMatchObject({
      status: "error",
    });
  });
});
