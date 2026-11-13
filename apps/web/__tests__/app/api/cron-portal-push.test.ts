const { mockPush, mockExpire, mockRevalidateTag, mockCapture, mockMessage } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockExpire: vi.fn(),
    mockRevalidateTag: vi.fn(),
    mockCapture: vi.fn(),
    mockMessage: vi.fn(),
  }));

vi.mock("@redshirt-sports/db/queries", () => ({
  pushPortal: mockPush,
  expirePendingPortalPushes: mockExpire,
}));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mockCapture,
  captureMessage: mockMessage,
}));

import { readFileSync } from "node:fs";
import path from "node:path";

import { GET } from "@/app/api/cron/portal-push/route";

const SECRET = "a-very-long-cron-secret";
const call = (authorization?: string) =>
  GET(
    new Request("https://example.com/api/cron/portal-push", {
      headers: authorization ? { authorization } : {},
    }),
  );

/** Runs the expire callback with these tags, the way the real helper does for each push. */
const expireWith = (tags: string[], result = { expired: 1, failed: [] }) =>
  mockExpire.mockImplementationOnce(async (expire) => {
    await expire(tags);
    return result;
  });

describe("GET /api/cron/portal-push", () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    mockExpire.mockResolvedValue({ expired: 0, failed: [] });
  });
  afterEach(() => {
    process.env.CRON_SECRET = original;
    vi.clearAllMocks();
  });

  it("refuses to run without CRON_SECRET configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong bearer token", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("pushes pending changes and expires their tags", async () => {
    mockPush.mockResolvedValueOnce({
      pushId: 7,
      playerCount: 2,
      tags: ["portal:players", "portal:football:2027"],
    });
    expireWith(["portal:players", "portal:football:2027"]);

    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockPush).toHaveBeenCalledWith({ trigger: "cron" });
    expect(mockRevalidateTag).toHaveBeenCalledWith("portal:players", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "portal:football:2027",
      "max",
    );
    expect(await res.json()).toMatchObject({
      pushed: { pushId: 7, playerCount: 2 },
      pushError: null,
      expired: 1,
    });
  });

  it("still retries earlier expiries when nothing is pending", async () => {
    mockPush.mockResolvedValueOnce(null);
    expireWith(["player:100000"]);

    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("player:100000", "max");
    expect(await res.json()).toMatchObject({ pushed: null });
  });

  it("reports a failed push but still expires earlier pushes", async () => {
    mockPush.mockRejectedValueOnce(new Error("lock timeout"));
    expireWith(["portal:football:2027"]);

    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(mockCapture).toHaveBeenCalled();
    expect(mockExpire).toHaveBeenCalled();
    expect(await res.json()).toMatchObject({ pushError: "lock timeout" });
  });

  it("reports a push that throws something other than an Error", async () => {
    mockPush.mockRejectedValueOnce("connection reset");

    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ pushError: "connection reset" });
  });

  it("reports a failed expiry", async () => {
    mockPush.mockResolvedValueOnce(null);
    mockExpire.mockResolvedValueOnce({
      expired: 0,
      failed: [{ pushId: 3, error: "boom" }],
    });

    expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
    expect(mockMessage).toHaveBeenCalledWith(
      "Portal push 3 cache expiry failed: boom",
      "warning",
    );
  });

  it("is scheduled nightly in vercel.json", () => {
    const config = JSON.parse(
      readFileSync(path.join(__dirname, "../../../vercel.json"), "utf8"),
    ) as {
      schedules: Record<string, { path: string; schedule: string }>;
    };
    expect(
      Object.values(config.schedules).filter(
        (entry) => entry.path === "/api/cron/portal-push",
      ),
    ).toEqual([expect.objectContaining({ schedule: "0 3 * * *" })]);
  });
});
