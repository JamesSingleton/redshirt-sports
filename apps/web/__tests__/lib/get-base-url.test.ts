import { getBaseUrl } from "@/lib/get-base-url";

describe("getBaseUrl", () => {
  const originalEnv = { ...process.env };
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // @ts-expect-error server-side tests should not use the browser branch
    delete globalThis.window;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.window = originalWindow;
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

  it("falls back to NEXT_PUBLIC_SITE_URL in production", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "www.redshirtsports.xyz";

    expect(getBaseUrl()).toBe("https://www.redshirtsports.xyz");
  });

  it("throws when production URL is not configured", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(() => getBaseUrl()).toThrow(
      "Production base URL is not configured. Set VERCEL_PROJECT_PRODUCTION_URL or NEXT_PUBLIC_SITE_URL.",
    );
  });

  it("returns the preview URL when VERCEL_ENV is preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "redshirt-sports-git-feature.vercel.app";

    expect(getBaseUrl()).toBe("https://redshirt-sports-git-feature.vercel.app");
  });

  it("uses the browser origin on localhost even when NEXT_PUBLIC_SITE_URL is set", () => {
    globalThis.window = {
      ...originalWindow,
      location: {
        ...originalWindow.location,
        hostname: "localhost",
        origin: "http://localhost:3000",
      },
    } as Window & typeof globalThis;
    process.env.NEXT_PUBLIC_SITE_URL = "www.redshirtsports.xyz";

    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("uses configured public URL in the browser on production hostnames", () => {
    globalThis.window = {
      ...originalWindow,
      location: {
        ...originalWindow.location,
        hostname: "www.redshirtsports.xyz",
        origin: "https://www.redshirtsports.xyz",
      },
    } as Window & typeof globalThis;
    process.env.NEXT_PUBLIC_SITE_URL = "www.redshirtsports.xyz";

    expect(getBaseUrl()).toBe("https://www.redshirtsports.xyz");
  });
});
