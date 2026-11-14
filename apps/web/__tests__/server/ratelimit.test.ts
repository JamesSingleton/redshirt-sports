import { describe, expect, it, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(function Redis() {
    return {};
  }),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    vi.fn(function Ratelimit(this: unknown, config: unknown) {
      Object.assign(this as object, { config });
    }),
    {
      slidingWindow: vi.fn((requests: number, window: string) => ({
        requests,
        window,
      })),
    },
  ),
}));

describe("ratelimit", () => {
  it("exports configured Ratelimit instances", async () => {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { ratelimit, newsletterRatelimit, newsletterDailyRatelimit } =
      await import("@/server/ratelimit");

    expect(ratelimit).toBeDefined();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: true,
        prefix: "@upstash/ratelimit",
      }),
    );
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(10, "100 s");

    expect(newsletterRatelimit).toBeDefined();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: true,
        prefix: "@upstash/ratelimit/newsletter",
      }),
    );
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(3, "3600 s");

    expect(newsletterDailyRatelimit).toBeDefined();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: true,
        prefix: "@upstash/ratelimit/newsletter-daily",
      }),
    );
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(90, "86400 s");
  });
});
