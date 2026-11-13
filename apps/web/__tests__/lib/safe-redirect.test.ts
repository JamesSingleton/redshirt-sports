import { safeRedirectPath } from "@/lib/safe-redirect";

const ORIGIN = "https://www.redshirtsports.com";

describe("safeRedirectPath", () => {
  it("returns null for empty values", () => {
    expect(safeRedirectPath(null, ORIGIN)).toBeNull();
    expect(safeRedirectPath(undefined, ORIGIN)).toBeNull();
    expect(safeRedirectPath("", ORIGIN)).toBeNull();
  });

  it("keeps relative paths with query and hash", () => {
    expect(safeRedirectPath("/vote/football/fbs?x=1#top", ORIGIN)).toBe(
      "/vote/football/fbs?x=1#top",
    );
  });

  it("reduces same-origin absolute URLs to their path", () => {
    expect(safeRedirectPath(`${ORIGIN}/vote?week=3`, ORIGIN)).toBe(
      "/vote?week=3",
    );
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example",
    "javascript:alert(1)",
    "http://www.redshirtsports.com/downgrade",
  ])("rejects off-site or non-http target %s", (value) => {
    expect(safeRedirectPath(value, ORIGIN)).toBeNull();
  });

  it("returns null for unparseable input", () => {
    expect(safeRedirectPath("/ok", "not a base")).toBeNull();
  });
});
