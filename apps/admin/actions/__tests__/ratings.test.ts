import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  getPoolById: vi.fn(),
  setPoolFlags: vi.fn(),
  publishRun: vi.fn(),
  withJob: vi.fn(),
  JobBusyError: class JobBusyError extends Error {},
}));
const { mockAfter, mockRevalidateWeb } = vi.hoisted(() => ({
  mockAfter: vi.fn((callback: () => unknown) => callback()),
  mockRevalidateWeb: vi.fn(),
}));

vi.mock("@redshirt-sports/db/ratings", () => db);
vi.mock("@redshirt-sports/auth/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_admin" }),
}));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/revalidate-web-ratings", () => ({
  revalidateWebRatingsCache: mockRevalidateWeb,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: mockAfter }));

import { publishRatingsRun, setRatingsPoolFlags } from "@/actions/ratings";

describe("ratings admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getPoolById.mockResolvedValue({
      id: "pool-1",
      sportSlug: "football",
      slug: "fcs",
    });
    db.withJob.mockImplementation(
      async (
        _input: unknown,
        work: (job: unknown) => Promise<{ value: unknown }>,
      ) => {
        const job = {
          lines: [] as string[],
          log: (line: string) => job.lines.push(line),
        };
        return { value: (await work(job)).value, job };
      },
    );
  });

  it("turns the cron on without touching the public site", async () => {
    const result = await setRatingsPoolFlags({
      poolId: "pool-1",
      isActive: true,
    });
    expect(db.setPoolFlags).toHaveBeenCalledWith("pool-1", { isActive: true });
    expect(result).toMatchObject({
      ok: true,
      message: "The cron will sync and publish this pool.",
    });
    expect(mockRevalidateWeb).not.toHaveBeenCalled();
  });

  it("making the pages public expires the web cache", async () => {
    const result = await setRatingsPoolFlags({
      poolId: "pool-1",
      isPublic: true,
    });
    expect(db.setPoolFlags).toHaveBeenCalledWith("pool-1", { isPublic: true });
    expect(result.message).toBe("Ratings pages are now public.");
    expect(mockRevalidateWeb).toHaveBeenCalledWith("football", "fcs");
  });

  it("reports hiding and pausing, and failures", async () => {
    expect(
      (await setRatingsPoolFlags({ poolId: "pool-1", isPublic: false }))
        .message,
    ).toBe("Ratings pages are hidden from the public.");
    expect(
      (await setRatingsPoolFlags({ poolId: "pool-1", isActive: false }))
        .message,
    ).toBe("The cron will skip this pool.");
    db.setPoolFlags.mockRejectedValueOnce(new Error("db down"));
    expect(
      await setRatingsPoolFlags({ poolId: "pool-1", isActive: true }),
    ).toMatchObject({
      ok: false,
      message: "db down",
    });
  });

  it("publishes a run as the signed-in admin and expires the web cache", async () => {
    const result = await publishRatingsRun({
      poolId: "pool-1",
      runId: "run-1",
      allowBlockers: false,
    });
    expect(db.publishRun).toHaveBeenCalledWith("run-1", "user_admin", {
      allowBlockers: false,
    });
    expect(result.ok).toBe(true);
    expect(mockRevalidateWeb).toHaveBeenCalledWith("football", "fcs");
  });
});
