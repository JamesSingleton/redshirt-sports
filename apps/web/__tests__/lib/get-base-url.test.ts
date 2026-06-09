import { getBaseUrl } from "@/lib/get-base-url";

describe("getBaseUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns localhost in development", () => {
    delete process.env.VERCEL_ENV;
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("returns the production URL when VERCEL_ENV is production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "redshirtsports.com";

    expect(getBaseUrl()).toBe("https://redshirtsports.com");
  });

  it("returns the preview URL when VERCEL_ENV is preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "redshirt-sports-git-feature.vercel.app";

    expect(getBaseUrl()).toBe("https://redshirt-sports-git-feature.vercel.app");
  });
});
