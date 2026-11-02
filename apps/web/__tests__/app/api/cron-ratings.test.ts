const {
  mockListPools,
  mockRunPipeline,
  mockRevalidateTag,
  mockCapture,
  mockMessage,
} = vi.hoisted(() => ({
  mockListPools: vi.fn(),
  mockRunPipeline: vi.fn(),
  mockRevalidateTag: vi.fn(),
  mockCapture: vi.fn(),
  mockMessage: vi.fn(),
}));

vi.mock("@redshirt-sports/db/ratings", () => ({
  listPools: mockListPools,
  runPipeline: mockRunPipeline,
  ratingsInvalidationTags: (sport: string, pool: string) => [
    "ratings",
    `ratings:${sport}:${pool}`,
  ],
}));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mockCapture,
  captureMessage: mockMessage,
}));

import { GET } from "@/app/api/cron/ratings/route";

const SECRET = "a-very-long-cron-secret";
const call = (authorization?: string) =>
  GET(
    new Request("https://example.com/api/cron/ratings", {
      headers: authorization ? { authorization } : {},
    }),
  );

describe("GET /api/cron/ratings", () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    mockListPools.mockResolvedValue([{ sportSlug: "football", slug: "fcs" }]);
  });
  afterEach(() => {
    process.env.CRON_SECRET = original;
    vi.clearAllMocks();
  });

  it("refuses to run without CRON_SECRET configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
    expect(mockRunPipeline).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong bearer token", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect(mockRunPipeline).not.toHaveBeenCalled();
  });

  it("expires the pool's pages only when it published", async () => {
    mockRunPipeline.mockResolvedValueOnce({
      status: "published",
      message: "Published 2026 Week 10.",
      runId: "run-1",
      lines: [],
    });
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockRunPipeline).toHaveBeenCalledWith({
      pool: { sportSlug: "football", slug: "fcs" },
      trigger: "cron",
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("ratings:football:fcs", {
      expire: 0,
    });

    mockRevalidateTag.mockClear();
    mockRunPipeline.mockResolvedValueOnce({
      status: "waiting",
      message: "Waiting",
      lines: [],
    });
    await call(`Bearer ${SECRET}`);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("warns Sentry when unmapped teams block a publish", async () => {
    mockRunPipeline.mockResolvedValueOnce({
      status: "blocked",
      message: "Blocked: 1 unmapped pool member(s) played games.",
      lines: [],
    });
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockMessage).toHaveBeenCalledWith(
      expect.stringContaining("football/fcs"),
      "warning",
    );
  });

  it("records non-Error failures as text", async () => {
    mockRunPipeline.mockRejectedValueOnce("boom");
    const body = await (await call(`Bearer ${SECRET}`)).json();
    expect(body.results[0].error).toBe("boom");
  });

  it("reports a failing pool to Sentry and returns 500", async () => {
    mockRunPipeline.mockRejectedValueOnce(new Error("ESPN down"));
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(mockCapture).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      results: [{ pool: "football/fcs", error: "ESPN down" }],
    });
  });
});
