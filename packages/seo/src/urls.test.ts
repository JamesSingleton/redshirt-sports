import { describe, expect, it } from "vitest";

import { sportBase, urls } from "./urls";

describe("urls", () => {
  it("builds the college sport base", () => {
    expect(sportBase("cfb")).toBe("/college/football");
    expect(urls.level("college")).toBe("/college");
    expect(urls.news("mbb", 2)).toBe("/college/mens-basketball/news?page=2");
    expect(urls.news("cfb")).toBe("/college/football/news");
  });

  it("uses week-n segments and omits page 1", () => {
    expect(urls.pollWeek("cfb", "fcs", 2026, 7)).toBe(
      "/college/football/rankings/fcs/2026/week-7",
    );
    expect(urls.pollWeek("cfb", "fcs", 2026, "preseason")).toBe(
      "/college/football/rankings/fcs/2026/preseason",
    );
    expect(urls.team("hollins")).toBe("/teams/hollins");
  });

  it("points vote links at vote.redshirtsports.com", () => {
    expect(urls.voteBallot("fcs", 2026, 7)).toBe(
      "https://vote.redshirtsports.com/ballot/fcs/2026/week-7",
    );
    expect(urls.voteInvite("abc")).toBe(
      "https://vote.redshirtsports.com/invite/abc",
    );
  });
});
