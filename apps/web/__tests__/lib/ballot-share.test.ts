import { describe, expect, it } from "vitest";

import {
  ballotShareFilename,
  ballotShareTitle,
  buildPostText,
  xIntentUrl,
} from "@/lib/ballot-share";

describe("ballotShareTitle", () => {
  it("names the poll and week", () => {
    expect(ballotShareTitle({ poll: "FCS", week: 10 })).toBe(
      "FCS Top 25 Ballot · Week 10",
    );
  });

  it("calls week 0 the preseason ballot", () => {
    expect(ballotShareTitle({ poll: "FBS", week: 0 })).toBe(
      "FBS Preseason Top 25 Ballot",
    );
  });
});

describe("ballotShareFilename", () => {
  it("slugs the poll label", () => {
    expect(
      ballotShareFilename({ poll: "Division II", season: 2026, week: 3 }),
    ).toBe("redshirt-sports-division-ii-2026-week-3-ballot.png");
  });
});

describe("buildPostText", () => {
  it("tags the site and links the poll", () => {
    expect(
      buildPostText({
        poll: "FCS",
        week: 10,
        url: "https://www.redshirtsports.com/college/football/rankings/fcs",
      }),
    ).toBe(
      "My Week 10 FCS Top 25 ballot for @_redshirtsports is in. Follow the poll: https://www.redshirtsports.com/college/football/rankings/fcs",
    );
  });

  it("says preseason for week 0", () => {
    expect(buildPostText({ poll: "FBS", week: 0, url: "u" })).toMatch(
      /^My preseason FBS Top 25 ballot/,
    );
  });
});

describe("xIntentUrl", () => {
  it("encodes the post text for X's web intent", () => {
    expect(xIntentUrl("a & b @c")).toBe(
      "https://x.com/intent/post?text=a%20%26%20b%20%40c",
    );
  });
});
