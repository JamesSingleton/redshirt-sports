const { mockCheckHealth, mockRedisPing } = vi.hoisted(() => ({
  mockCheckHealth: vi.fn(),
  mockRedisPing: vi.fn(),
}));

vi.mock("@redshirt-sports/db/utils/health", () => ({
  checkHealth: mockCheckHealth,
}));

vi.mock("@/utils/redis", () => ({
  default: {
    ping: mockRedisPing,
  },
}));

import { GET } from "@/app/api/health/ready/route";

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    mockCheckHealth.mockReset();
    mockRedisPing.mockReset();
  });

  it("returns 200 when database and redis are healthy", async () => {
    mockCheckHealth.mockResolvedValue(undefined);
    mockRedisPing.mockResolvedValue("PONG");

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "ok",
      checks: { database: "ok", redis: "ok" },
    });
  });

  it("returns 503 when database check fails", async () => {
    mockCheckHealth.mockRejectedValue(new Error("db down"));
    mockRedisPing.mockResolvedValue("PONG");

    const res = await GET();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      status: "degraded",
      checks: { database: "error", redis: "ok" },
    });
  });

  it("returns 503 when redis check fails", async () => {
    mockCheckHealth.mockResolvedValue(undefined);
    mockRedisPing.mockRejectedValue(new Error("redis down"));

    const res = await GET();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      status: "degraded",
      checks: { database: "ok", redis: "error" },
    });
  });

  it("returns 503 when a check times out", async () => {
    vi.useFakeTimers();
    mockCheckHealth.mockImplementation(() => new Promise(() => undefined));
    mockRedisPing.mockResolvedValue("PONG");

    const pending = GET();
    await vi.advanceTimersByTimeAsync(3_000);
    const res = await pending;

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      status: "degraded",
      checks: { database: "error", redis: "ok" },
    });

    vi.useRealTimers();
  });
});
