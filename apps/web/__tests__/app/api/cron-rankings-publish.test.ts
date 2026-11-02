const { mockAutoPublish, mockIsTime, mockRevalidateTag, mockMessage } =
  vi.hoisted(() => ({
    mockAutoPublish: vi.fn(),
    mockIsTime: vi.fn(),
    mockRevalidateTag: vi.fn(),
    mockMessage: vi.fn(),
  }));

vi.mock("@redshirt-sports/db/queries", () => ({
  autoPublishDueRankings: mockAutoPublish,
  isAutoPublishTime: mockIsTime,
}));
vi.mock("@redshirt-sports/db/rankings-cache-tags", () => ({
  rankingsInvalidationTags: ({
    sport,
    division,
    year,
    week,
  }: {
    sport: string;
    division: string;
    year: number;
    week: number;
  }) => ["rankings", `rankings:${sport}:${division}:${year}:${week}`],
}));
vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: mockMessage }));

import { GET } from "@/app/api/cron/rankings/route";

const SECRET = "a-very-long-cron-secret";
const call = (authorization?: string) =>
  GET(
    new Request("https://example.com/api/cron/rankings", {
      headers: authorization ? { authorization } : {},
    }),
  );

const published = {
  poll: "FCS Top 25",
  sportSlug: "football",
  division: "fcs",
  year: 2026,
  week: 10,
  status: "published",
  ballots: 20,
  missed: 2,
  lockedOutUserIds: [] as string[],
};

describe("GET /api/cron/rankings", () => {
  const original = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    mockIsTime.mockReturnValue(true);
  });
  afterEach(() => {
    process.env.CRON_SECRET = original;
    vi.clearAllMocks();
  });

  it("refuses to run without CRON_SECRET configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
    expect(mockAutoPublish).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong bearer token", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect(mockAutoPublish).not.toHaveBeenCalled();
  });

  it("does nothing before 9 AM Monday Central", async () => {
    mockIsTime.mockReturnValue(false);
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockAutoPublish).not.toHaveBeenCalled();
  });

  it("expires the published week's pages and reports lockouts", async () => {
    mockAutoPublish.mockResolvedValue([
      { ...published, lockedOutUserIds: ["user_1"] },
      {
        ...published,
        division: "fbs",
        status: "skipped",
        reason: "No ballots",
      },
    ]);
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      "rankings:football:fcs:2026:10",
      { expire: 0 },
    );
    expect(mockRevalidateTag).not.toHaveBeenCalledWith(
      expect.stringContaining("fbs"),
      expect.anything(),
    );
    expect(mockMessage).toHaveBeenCalledWith(
      "FCS Top 25: 1 voter(s) locked out for missed ballots",
      "info",
    );
  });

  it("returns 500 and reports a failed poll", async () => {
    mockAutoPublish.mockResolvedValue([
      published,
      { ...published, status: "failed", reason: "boom" },
    ]);
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(mockMessage).toHaveBeenCalledWith(
      "Rankings auto-publish failed for football/fcs: boom",
      "error",
    );
  });
});
