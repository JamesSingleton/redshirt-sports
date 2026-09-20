vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import robots from "@/app/robots";

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
        "https://redshirtsports.com/college/sitemap.xml",
      ]),
    );
  });
});
