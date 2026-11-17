import { describe, expect, it } from "vitest";

import { parsePlayerExternalId } from "./external-id";

describe("parsePlayerExternalId", () => {
  it("takes a bare id or the player's profile URL", () => {
    expect(parsePlayerExternalId("espn", " 4432577 ")).toBe("4432577");
    expect(
      parsePlayerExternalId(
        "espn",
        "https://www.espn.com/college-football/player/_/id/4432577/jalen-brooks",
      ),
    ).toBe("4432577");
    expect(
      parsePlayerExternalId(
        "espn",
        "https://espn.com/mens-college-basketball/player/_/id/5105612?x=1",
      ),
    ).toBe("5105612");
    expect(
      parsePlayerExternalId("ncaa", "https://stats.ncaa.org/players/7612345"),
    ).toBe("7612345");
  });

  it("refuses anything else, including another site's URL", () => {
    expect(
      parsePlayerExternalId("ncaa", "https://www.espn.com/x/_/id/4432577"),
    ).toBeNull();
    expect(
      parsePlayerExternalId("espn", "https://evil.example/espn.com/_/id/1"),
    ).toBeNull();
    expect(parsePlayerExternalId("espn", "abc")).toBeNull();
    expect(parsePlayerExternalId("espn", "1234567890123")).toBeNull();
    expect(parsePlayerExternalId("espn", "")).toBeNull();
    expect(parsePlayerExternalId("espn", "x".repeat(301))).toBeNull();
  });
});
