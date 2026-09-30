import {
  getDivisionFeed,
  getSiteFeed,
  getSportFeed,
} from "@/lib/rss-feed-links";

describe("rss feed links", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports";
  });

  it("builds the site-wide feed", () => {
    expect(getSiteFeed()).toEqual({
      path: "/api/rss/feed.xml",
      title: "Redshirt Sports",
    });
  });

  it("builds a sport feed", () => {
    expect(getSportFeed({ slug: "football", title: "Football" })).toEqual({
      path: "/api/rss/football/feed.xml",
      title: "Redshirt Sports: Football News",
    });
  });

  it("builds a division feed", () => {
    expect(
      getDivisionFeed({
        sport: { slug: "football", title: "Football" },
        division: { slug: "fbs", name: "FBS" },
      }),
    ).toEqual({
      path: "/api/rss/football/fbs/feed.xml",
      title: "Redshirt Sports: FBS Football News",
    });
  });
});
