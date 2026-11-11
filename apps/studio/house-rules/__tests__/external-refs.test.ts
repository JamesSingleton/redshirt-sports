import {
  formatExternalRef,
  parseExternalRef,
} from "@redshirt-sports/sanity/external-refs";
import {
  isStoryType,
  STORY_TYPES,
  storySchemaType,
  storyTypeTitle,
} from "@redshirt-sports/sanity/story-types";
import { describe, expect, it } from "vitest";

describe("external refs", () => {
  it("round-trips and tidies the label", () => {
    const value = formatExternalRef({
      provider: "ncaa",
      id: "6387211",
      label: "  Idaho   at Montana ",
    });
    expect(value).toBe("ncaa:6387211|Idaho at Montana");
    expect(parseExternalRef(value)).toEqual({
      provider: "ncaa",
      id: "6387211",
      label: "Idaho at Montana",
    });
  });

  it("keeps a label that contains the separator", () => {
    expect(parseExternalRef("espn:1|A | B")?.label).toBe("A | B");
  });

  it("rejects unknown providers, missing parts, and blank labels", () => {
    for (const value of [
      undefined,
      null,
      "",
      "espn:401",
      "yahoo:401|X",
      "espn:|X",
      "espn:4 01|X",
      "espn:401|   ",
    ]) {
      expect(parseExternalRef(value)).toBeNull();
    }
  });
});

describe("story types", () => {
  it("are formats only, with titles", () => {
    expect(STORY_TYPES.map((type) => type.value)).toEqual([
      "news",
      "analysis",
      "feature",
      "opinion",
      "explainer",
      "interview",
      "notebook",
      "rankings",
      "predictions",
      "game-preview",
      "game-recap",
    ]);
    expect(storySchemaType("opinion")).toBe("OpinionNewsArticle");
    expect(storySchemaType("explainer")).toBe("BackgroundNewsArticle");
    expect(storySchemaType("unknown")).toBe("NewsArticle");
    expect(storyTypeTitle("game-recap")).toBe("Game Recap");
    expect(storyTypeTitle("recruiting")).toBeUndefined();
    expect(isStoryType("opinion")).toBe(true);
    expect(isStoryType("transfer")).toBe(false);
  });
});
