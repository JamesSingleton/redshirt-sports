vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import robots from "@/app/robots";

/**
 * Google's robots.txt path matching: `*` matches any run of characters
 * (including "/"), `$` anchors the end, otherwise it's a prefix match.
 */
function blocks(pattern: string, path: string) {
  const source = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}`).test(path);
}

describe("robots", () => {
  it("returns disallow rules and sitemap URLs", () => {
    const result = robots();

    expect(result.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: ["/"],
        disallow: expect.arrayContaining(["/api/cron/", "/vote/", "/search/"]),
      }),
    );
    expect(result.sitemap).toEqual(
      expect.arrayContaining([
        "https://redshirtsports.com/sitemap.xml",
        "https://redshirtsports.com/rankings/sitemap.xml",
        "https://redshirtsports.com/college/sitemap.xml",
      ]),
    );
  });

  it("keeps crawlers off past-week and printable team sheets only", () => {
    const { disallow } = robots().rules as { disallow: string[] };
    const blocked = (path: string) =>
      disallow.some((pattern) => blocks(pattern, path));

    // Blocked: every past week's team sheets, and the printable sheets.
    expect(
      blocked(
        "/college/football/ratings/fcs/2025/postseason/teams/montana-state-bobcats",
      ),
    ).toBe(true);
    expect(blocked("/college/football/ratings/fcs/2026/8/teams/x")).toBe(true);
    expect(blocked("/college/football/ratings/fcs/2026/8/team-sheets")).toBe(
      true,
    );

    // Still crawlable: the latest sheet, the tables, and the ratings pages.
    expect(
      blocked("/college/football/ratings/fcs/teams/montana-state-bobcats"),
    ).toBe(false);
    expect(blocked("/college/football/ratings/fcs")).toBe(false);
    expect(blocked("/college/football/ratings/fcs/2026/8")).toBe(false);
    expect(blocked("/college/football/ratings/fcs/accuracy")).toBe(false);
    expect(blocked("/ratings/methodology")).toBe(false);
    expect(blocked("/college/teams/montana-state-bobcats")).toBe(false);
  });
});
