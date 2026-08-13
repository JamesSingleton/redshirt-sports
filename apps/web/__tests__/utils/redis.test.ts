import { describe, expect, it, vi } from "vitest";

describe("redis", () => {
  it("creates a Redis client from env when URLs are set", async () => {
    vi.resetModules();
    const fromEnv = vi.fn(() => ({ ping: vi.fn() }));
    vi.doMock("@upstash/redis", () => ({
      Redis: { fromEnv },
    }));

    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";

    const redis = (await import("@/utils/redis")).default;
    expect(redis).toBeDefined();
    expect(fromEnv).toHaveBeenCalled();
  });

  it("throws when both redis env vars are missing", async () => {
    vi.resetModules();
    vi.doMock("@upstash/redis", () => ({
      Redis: { fromEnv: vi.fn() },
    }));

    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;

    await expect(import("@/utils/redis")).rejects.toThrow(
      "UPSTASH_REDIS_REST_TOKEN and or UPSTASH_REDIS_REST_URL is not set",
    );

    process.env.UPSTASH_REDIS_REST_TOKEN = token;
    process.env.UPSTASH_REDIS_REST_URL = url;
  });
});
