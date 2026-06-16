import { describe, expect, it, vi } from "vitest";

import {
  isVisitableLinkUrl,
  normalizeLinkUrl,
  toAbsoluteLinkUrl,
} from "../utils/linkUrl";

vi.mock("@/utils/helper", () => ({
  getPresentationUrl: () => "http://localhost:3000",
}));

describe("linkUrl", () => {
  it("prefixes relative internal paths with the presentation URL", () => {
    expect(toAbsoluteLinkUrl("/a-brief-analysis-of-cornell")).toBe(
      "http://localhost:3000/a-brief-analysis-of-cornell",
    );
  });

  it("leaves absolute URLs unchanged", () => {
    expect(toAbsoluteLinkUrl("https://example.com/article")).toBe(
      "https://example.com/article",
    );
  });

  it("normalizes undefined URLs", () => {
    expect(normalizeLinkUrl(undefined)).toBeUndefined();
  });

  it("detects visitable http(s) links", () => {
    expect(isVisitableLinkUrl("http://localhost:3000/foo")).toBe(true);
    expect(isVisitableLinkUrl("/foo")).toBe(true);
    expect(isVisitableLinkUrl(undefined)).toBe(false);
  });
});
