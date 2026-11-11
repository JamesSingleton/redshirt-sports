import {
  buildArticleAbout,
  buildArticleAuthor,
  buildArticleCorrections,
  buildArticleMentions,
} from "@/lib/article-entities";

const base = "https://www.redshirtsports.com";

describe("buildArticleAuthor", () => {
  it("adds role, bio, beats, and profiles", () => {
    expect(
      buildArticleAuthor(
        {
          name: "Jane Doe",
          slug: "jane-doe",
          roles: [null, "Senior Writer", "Editor"],
          biography: "Covers the Big Sky.",
          knowsAbout: ["Football", null],
          socialLinks: { twitter: "https://x.com/jane", bad: "not-a-url" },
        },
        base,
      ),
    ).toEqual({
      "@type": "Person",
      name: "Jane Doe",
      url: `${base}/people/jane-doe`,
      sameAs: ["https://x.com/jane"],
      jobTitle: "Senior Writer",
      description: "Covers the Big Sky.",
      knowsAbout: ["Football"],
    });
  });

  it("leaves out what the author doesn't have", () => {
    expect(buildArticleAuthor(null, base)).toEqual({
      "@type": "Person",
      name: undefined,
      url: undefined,
      sameAs: undefined,
      jobTitle: undefined,
      description: undefined,
    });
  });
});

describe("buildArticleAbout", () => {
  it("lists the game first, then the teams", () => {
    expect(
      buildArticleAbout(
        {
          sport: { title: "Football" },
          game: "espn:401547|Montana at Montana State · Nov 22, 2025",
          teams: [
            { name: "Montana", slug: "montana-grizzlies" },
            { name: "No Slug" },
            { name: null },
            null,
          ],
        },
        base,
      ),
    ).toEqual([
      {
        "@type": "SportsEvent",
        name: "Montana at Montana State · Nov 22, 2025",
        identifier: "espn:401547",
        sport: "Football",
      },
      {
        "@type": "SportsTeam",
        name: "Montana",
        url: `${base}/college/teams/montana-grizzlies`,
        sport: "Football",
      },
      { "@type": "SportsTeam", name: "No Slug", sport: "Football" },
    ]);
  });

  it("is empty without teams or a valid game", () => {
    expect(buildArticleAbout({ game: "not a ref" }, base)).toEqual([]);
    expect(
      buildArticleAbout({ game: "ncaa:9|Idaho at Montana" }, base),
    ).toEqual([
      {
        "@type": "SportsEvent",
        name: "Idaho at Montana",
        identifier: "ncaa:9",
      },
    ]);
    expect(buildArticleAbout({ teams: [{ name: "Idaho" }] }, base)[0]).toEqual({
      "@type": "SportsTeam",
      name: "Idaho",
    });
  });
});

describe("buildArticleMentions", () => {
  it("lists conferences and players", () => {
    expect(
      buildArticleMentions({
        conferences: [{ name: "Big Sky Conference" }, { name: null }],
        players: ["espn:5081234|Keali'i Ah Yat · Montana", "garbage", null],
      }),
    ).toEqual([
      { "@type": "SportsOrganization", name: "Big Sky Conference" },
      { "@type": "Person", name: "Keali'i Ah Yat", identifier: "espn:5081234" },
    ]);
    expect(buildArticleMentions({})).toEqual([]);
  });
});

describe("buildArticleCorrections", () => {
  it("keeps corrections with text, dated when known", () => {
    expect(
      buildArticleCorrections({
        corrections: [
          { text: "Fixed the score.", date: "2026-11-02T00:00:00Z" },
          { text: "Undated." },
          { date: "2026-11-03T00:00:00Z" },
          null,
        ],
      }),
    ).toEqual([
      {
        "@type": "CorrectionComment",
        text: "Fixed the score.",
        datePublished: "2026-11-02T00:00:00Z",
      },
      { "@type": "CorrectionComment", text: "Undated." },
    ]);
  });
});
