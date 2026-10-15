import { afterEach, describe, expect, it } from "vitest";

import { reservedRootSegment } from "./reserved-paths";
import { pageHref, urls, voteOrigin } from "./urls";

describe("urls", () => {
  const previous = process.env.NEXT_PUBLIC_VOTE_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_VOTE_URL;
    } else {
      process.env.NEXT_PUBLIC_VOTE_URL = previous;
    }
  });

  it("does not build a /college page", () => {
    expect("level" in urls).toBe(false);
    expect(urls.levelNews("college")).toBe("/college/news");
    expect(urls.levelNews("college", 2)).toBe("/college/news?page=2");
  });

  it("omits the page query on page 1", () => {
    expect(pageHref("/college/football/news", 1)).toBe(
      "/college/football/news",
    );
    expect(urls.news("cfb", 1)).toBe("/college/football/news");
    expect(urls.news("cfb", 2)).toBe("/college/football/news?page=2");
  });

  it("builds sport paths from the level and sport segments", () => {
    expect(urls.article({ primarySport: "mbb", slug: "tipoff" })).toBe(
      "/college/mens-basketball/news/tipoff",
    );
    expect(urls.divisionNews("cfb", "fcs", 3)).toBe(
      "/college/football/fcs/news?page=3",
    );
    expect(urls.pollWeek("cfb", "fcs", 2026, 7)).toBe(
      "/college/football/rankings/fcs/2026/week-7",
    );
    expect(urls.pollWeek("cfb", "fcs", 2026, "preseason")).toBe(
      "/college/football/rankings/fcs/2026/preseason",
    );
    expect(urls.team("hollins")).toBe("/teams/hollins");
  });

  it("reads the vote origin from NEXT_PUBLIC_VOTE_URL", () => {
    process.env.NEXT_PUBLIC_VOTE_URL = "http://localhost:3002/";
    expect(voteOrigin()).toBe("http://localhost:3002");
    expect(urls.voteBallot("fcs", 2026, 7)).toBe(
      "http://localhost:3002/ballot/fcs/2026/week-7",
    );
    expect(urls.voteInvite("token")).toBe("http://localhost:3002/invite/token");
  });

  it("falls back to the vote subdomain when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_VOTE_URL;
    expect(voteOrigin()).toBe("https://vote.redshirtsports.com");
  });
});

describe("reservedRootSegment", () => {
  it("reserves college and high-school", () => {
    expect(reservedRootSegment("college")).toBe("college");
    expect(reservedRootSegment("/college")).toBe("college");
    expect(reservedRootSegment("high-school/football")).toBe("high-school");
    expect(reservedRootSegment("about")).toBeNull();
  });
});
