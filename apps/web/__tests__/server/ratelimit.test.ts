import { describe, expect, it, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
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
  it("exports a configured Ratelimit instance", async () => {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { ratelimit } = await import("@/server/ratelimit");

    expect(ratelimit).toBeDefined();
    expect(Ratelimit).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: true,
        prefix: "@upstash/ratelimit",
      }),
    );
    expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(10, "100 s");
  });
});
