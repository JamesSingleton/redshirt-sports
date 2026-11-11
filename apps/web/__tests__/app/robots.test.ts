vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import robots, { AI_ANSWER_CRAWLERS, AI_TRAINING_CRAWLERS } from "@/app/robots";

describe("robots", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  it("lets search engines crawl everything but private paths", () => {
    expect(rules[0]).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: ["/"],
        disallow: expect.arrayContaining(["/api/cron/", "/vote/", "/search/"]),
      }),
    );
  });

  it("allows AI answer engines, which cite and link articles", () => {
    expect(rules[1]).toEqual(
      expect.objectContaining({ userAgent: AI_ANSWER_CRAWLERS, allow: ["/"] }),
    );
    expect(AI_ANSWER_CRAWLERS).toEqual(
      expect.arrayContaining([
        "OAI-SearchBot",
        "PerplexityBot",
        "Claude-SearchBot",
      ]),
    );
  });

  it("blocks AI training crawlers everywhere", () => {
    expect(rules[2]).toEqual({
      userAgent: AI_TRAINING_CRAWLERS,
      disallow: ["/"],
    });
    expect(AI_TRAINING_CRAWLERS).toEqual(
      expect.arrayContaining([
        "GPTBot",
        "ClaudeBot",
        "Google-Extended",
        "CCBot",
      ]),
    );
    // A crawler is never in both lists.
    expect(
      AI_ANSWER_CRAWLERS.filter((bot) => AI_TRAINING_CRAWLERS.includes(bot)),
    ).toEqual([]);
  });

  it("lists every sitemap, including the Google News one", () => {
    expect(result.sitemap).toEqual(
      expect.arrayContaining([
        "https://redshirtsports.com/sitemap.xml",
        "https://redshirtsports.com/news-sitemap.xml",
        "https://redshirtsports.com/rankings/sitemap.xml",
        "https://redshirtsports.com/college/sitemap.xml",
        "https://redshirtsports.com/playoffs/sitemap.xml",
      ]),
    );
  });
});
