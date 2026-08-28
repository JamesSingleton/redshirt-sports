import { describe, expect, it, vi } from "vitest";

describe("redis", () => {
  it("creates a Redis client from validated env keys", async () => {
    vi.resetModules();
    const RedisCtor = vi.fn(function Redis() {
      return { ping: vi.fn() };
    });
    vi.doMock("@upstash/redis", () => ({
      Redis: RedisCtor,
    }));

    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.SKIP_ENV_VALIDATION = "true";

    const redis = (await import("@/utils/redis")).default;
    expect(redis).toBeDefined();
    expect(RedisCtor).toHaveBeenCalledWith({
      url: "https://test.upstash.io",
      token: "token",
    });
  });
});
